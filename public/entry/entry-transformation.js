/*
*   Service for applying the various transformations to the received
*   Entry object from the server.
*/

var FORMATTED_SUFFIX = '_formatted'
var BIOGRAPHY = 'biography'
var TOURS = 'tours'
var NARRATIVE = 'narrative'
var NOTES = 'notes'
var ENTRY_TEXT_SECTIONS = [ BIOGRAPHY, TOURS, NARRATIVE, NOTES ]

app.factory('entryTransformationService', function($http, entryHighlightingService, $timeout, $sce) {

    /*
    *   Private variable storing transformation functions.
    */

    var transformations = [
        
        calculateDurations,
        createTours,
        createOccupations,
        createMilitary,
        downloadMentionedNames,
        linkFootnotes,
        transformUnformattedEntryText.bind(null, ENTRY_TEXT_SECTIONS),
        highlightEntryText.bind(null, ENTRY_TEXT_SECTIONS),
        superscript.bind(null, [ BIOGRAPHY, TOURS, NARRATIVE ]),
        trustFormattedEntryText.bind(null, ENTRY_TEXT_SECTIONS)

    ]


    /*
    *   Applies entry transformations.
    */

    var applyTransformations = function(entry) {

        var promise = Promise.resolve()
        transformations.forEach(function(transformationFn) {
            promise = promise.then(function() {
                return transformationFn(entry)
            })
        })

        return promise.then(function() { return entry })

    }


    /*
    *   Returns public entry transformation function.
    */

    return {

        applyTransformations: applyTransformations,

    }


    /*
    *   --------------------------------------------------------
    */


    /*
    *   Calculates durations for indicated travels.
    */

    function calculateDurations(entry) {

        const DAYS_IN_MONTH = [ 0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ]
        const MONTHS_IN_YEAR = 12

        entry.travels.forEach(function(travel) {

            var dayDifference, monthDifference, yearDifference

            if (travel.travelDateSpecifiedInDictionary) {

                //  Calculates difference in days
                if (travel.travelStartDay && travel.travelEndDay) {
                    dayDifference = travel.travelEndDay - travel.travelStartDay + 1
                }

                //  Calculates difference in months
                if (travel.travelStartMonth && travel.travelEndMonth) {
                    
                    monthDifference = travel.travelEndMonth - travel.travelStartMonth
                    if (!dayDifference) monthDifference += 1
                    if (dayDifference < 0) {
                        dayDifference += DAYS_IN_MONTH[travel.travelEndMonth - 1 || 12]
                        monthDifference -= 1
                    }
                                    
                }

                //  Calculates difference in years
                if (travel.travelStartYear && travel.travelEndYear) {
                    yearDifference = travel.travelEndYear - travel.travelStartYear
                    if (!dayDifference && !monthDifference) yearDifference += 1
                    if (monthDifference < 0) {
                        monthDifference += MONTHS_IN_YEAR
                        yearDifference -= 1
                    }
                }

            }

            var arr = []
            if (yearDifference) arr.push(yearDifference + (yearDifference === 1 ? ' year' : ' years'))
            if (monthDifference) arr.push(monthDifference + (monthDifference === 1 ? ' month' : ' months'))
            if (dayDifference) arr.push(dayDifference + (dayDifference === 1 ? ' day' : ' days'))
            travel.travelDurationText = arr.join(', ') || '-'

        })

    }


    /*
    *   Creates tours out of travels.
    */

    function createTours(entry) {

        if (entry.travels) {

            var nest = d3.nest()
            .key(function(d) { return d.tourIndex })
            .entries(entry.travels)
            
            nest.forEach(function(d) {
                d.start = d.values[0].tourStartFrom
                d.end = d.values[0].tourEndFrom
            })
            
            entry.travel_tours = nest

        }
        
    }


    /*
    *   Creates occupation groups out of occupations.
    */

    function createOccupations(entry) {

        if (entry.occupations) {

            var nest = d3.nest()
            .key(function(d) { return d.group })
            .entries(entry.occupations)
            
            entry.grouped_occupations = nest

        }
        
    }


    /*
    *   Limits Military entries to only those with the rank field.
    */

    function createMilitary(entry) {

        entry.filtered_military = entry.military ? entry.military.filter(function(d){ return d.rank }) : []
    
    }


    /*
    *   Downloads entry data for mentioned names.
    */

    function downloadMentionedNames(entry) {

        return Promise.all(entry.mentionedNames.map(function(name) {
          
          if (name.entryIndex) return $http.get('/api/entries/' + name.entryIndex)
          else return (Promise.resolve(null))
        
        }))
        .then(function(responses) {
          
          responses.forEach(function(response, i) {
            if (response) entry.mentionedNames[i].entry = response.data.entry
          })
        
        })
        .catch(console.error.bind(console))

    }


    /*
    *   Creates linked footnote popups.
    */

    function linkFootnotes(entry) {

        return $http.get('/api/linked-footnotes/in-entry/' + entry.index)
        .then(function(response) {

            var notes = entry[NOTES + FORMATTED_SUFFIX] || entry[NOTES]
            var linkedFootnotes = response.data.sort(function(a, b) { return a.startIndex - b.startIndex })
            var linkedNoteNodes = []
            var previousEndIndex = 0
            if (notes && linkedFootnotes.length) {

                linkedFootnotes.forEach(function(footnote, i) {

                    var popoverText = footnote.fullText
                    var linkDestination = '/#/search/' + encodeURIComponent(JSON.stringify({
                        entry: { 
                            terms: [ { value: footnote.abbreviation } ],
                            sections: [
                                { key: 'biography', name: 'Biography', checked: false },
                                { key: 'narrative', name: 'Narrative', checked: false },
                                { key: 'tours', name: 'Tours', checked: false },
                                { key: 'notes', name: 'Notes', checked: true },
                            ],
                            beginnings: false,
                        }
                    }))

                    linkedNoteNodes.push({ link: false, text: notes.slice(previousEndIndex, footnote.startIndex) })
                    linkedNoteNodes.push({ link: true, linkDestination: linkDestination, popoverText: popoverText, text: notes.slice(footnote.startIndex, footnote.endIndex) })
                    if (i === linkedFootnotes.length - 1) linkedNoteNodes.push({ link: false, text: notes.slice(footnote.endIndex) })
                    else previousEndIndex = footnote.endIndex

                })

                var linkedNotes = ''
                linkedNoteNodes.forEach(function(node) {
                    if (node.link) {
                        linkedNotes += '<a href="' + node.linkDestination + '" data-toggle="popover" data-content="' + node.popoverText + '">'
                        linkedNotes += node.text
                        linkedNotes += '</a>'
                    } else linkedNotes += node.text
                })

                entry[NOTES + FORMATTED_SUFFIX] = linkedNotes
                $timeout(function() {
                    $('[data-toggle="popover"]').popover({ trigger: 'hover', placement: 'top', container: 'body' })
                    $('[data-toggle="popover"]').click(function(event) { $('.popover').remove() })
                })

            }

        })
        .catch(console.error.bind(console))
    
    }


    /*
    *   Displays sections as formatted, if unformatted.
    */

    function transformUnformattedEntryText(fields, entry) {

        fields.forEach(function(fieldKey) {

            if (entry[fieldKey] && !entry[fieldKey + FORMATTED_SUFFIX]) {

                //  Splits tours into paragraphs
                if (fieldKey === TOURS) {
                    entry[fieldKey + FORMATTED_SUFFIX] = entry[fieldKey].split(/\. (?=\[?-?\d{4})(?![^(]*\))(?![^[]*\])/g).join('</p><p>')
                }

                //  Splits narrative into paragraphs
                else if (fieldKey === NARRATIVE) {
                    entry[fieldKey + FORMATTED_SUFFIX] = entry[fieldKey].split('\n').join('</p><p>')
                }

                //  Doesn't split biography, notes
                else entry[fieldKey + FORMATTED_SUFFIX] = entry[fieldKey]

                //  Wraps in <p> tag
                entry[fieldKey + FORMATTED_SUFFIX] = '<p>' + entry[fieldKey + FORMATTED_SUFFIX] + '</p>'

            }

        })

    }


    /*
    *   Highlights entry text fields.
    */

    function highlightEntryText(fields, entry) {

        fields.forEach(function(fieldKey) {

            var value = entry[fieldKey + FORMATTED_SUFFIX]
            if (value) {

                var highlightedValue = entryHighlightingService.highlight('entry_' + fieldKey, value)
                entry[fieldKey + FORMATTED_SUFFIX] = highlightedValue

            }

        })
        
    }


    /*
    *   Adds superscript popups to biography, tours and narrative text.
    */

    function superscript(fields, entry) {

        splitNotes = entry.notes ? entry.notes.split(/\.\s[0-9]{1,2}\.\s/gi) : []
        fields.forEach(function(fieldKey) {

            var value = entry[fieldKey + FORMATTED_SUFFIX]
            if (value) {

                function replacer(match, p1, p2, p3, offset, string) {
                  var t = p2 == 1? splitNotes[p2-1] : p2 + ". " +  splitNotes[p2-1]
                  return p1 + "<sup class=\"text-primary\" data-toggle=\"popover\" data-content=\"" + t + "\">[" + p2 + "]</sup>"
                }

                var superscriptedValue = value.replace(/(\.|\,|'|\s[^&]\S+;|[a-z]|[0-9]{4})([0-9]{1,2})(?=\s|$|\n|\r|\<)/gi, replacer)
                entry[fieldKey + FORMATTED_SUFFIX] = superscriptedValue

            }

        })

    }


    /*
    *   Marks fields as trusted HTML.
    */

    function trustFormattedEntryText(fields, entry) {

        fields.forEach(function(fieldKey) {

            entry[fieldKey + FORMATTED_SUFFIX] = $sce.trustAsHtml(entry[fieldKey + FORMATTED_SUFFIX])

        })

    }

})

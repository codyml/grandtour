/*
*   Imports
*/

const router = require('express').Router()
const { isViewer, isEditor } = require('./auth')
const Entry = require('../models/entry')
const entryFields = require('../models/entry-fields')()


/*
*   Creates a new entry under the latest revision with the specified
*   index and any other fields.
*/

router.put('/api/entries/:index', isEditor, (req, res, next) => {

    Entry.createAtLatest(req.params.index, req.body)
    .then(entry => res.json(entry))
    .catch(next)

})


/*
*   Deletes a single entry under the latest revision.
*/

router.delete('/api/entries/:index', isEditor, (req, res, next) => {

    Entry.deleteAtLatest(req.params.index)
    .then(entry => {
        if (entry) res.json(entry)
        else { throw null /* Triggers the 404 Not Found error handler */ }
    })
    .catch(next)

})


/*
*   Retrieves and returns entry objects, optimized for visualizations.
*/

router.get('/api/entries/for-visualization/:entryIndexString?', isViewer, (req, res, next) => {

    let getEntriesForVisualization
    if (req.params.entryIndexString) {
        const indexes = JSON.parse(req.params.entryIndexString)
        const query = { index: { $in: indexes } }
        getEntriesForVisualization = Entry.findAtRevision(query, req.user.activeRevisionIndex)
    } else getEntriesForVisualization = Entry.findAtRevision(null, req.user.activeRevisionIndex)
    
    getEntriesForVisualization
    .then(entries => res.json(entries.map(entry => ({

        index: entry.index,
        fullName: entry.fullName,
        biographyExcerpt: entry.biography.slice(0, 200),
        gender: entry.type,
        entryLength: ((entry.biograpy || '') + (entry.tours || '') + (entry.narrative || '') + (entry.notes || '')).length,
        travelLength: entry.travels.reduce((accum, travel) => {

            if (travel.tourStartFrom && travel.tourEndFrom) {
                if (!accum.start || accum.start > travel.tourStartFrom) accum.start = travel.tourStartFrom
                if (!accum.end || accum.end < travel.tourEndFrom) accum.end = travel.tourEndFrom
            }

            if (accum.start && accum.end) accum.lengthInYears = accum.end - accum.start + 1
            return accum

        }, {}).lengthInYears,

        dateOfFirstTravel: entry.travels.reduce((accum, travel) => {

            if (accum) return accum
            else if (travel.travelStartYear) return Date.UTC(travel.travelStartYear, travel.travelStartMonth, travel.travelStartDay)

        }, null),

    }))))
    .catch(next)

})


/*
*   Retrieves a single Entry.
*/

router.get('/api/entries/:index', isViewer, (req, res, next) => {

    Entry.findByIndexAtRevision(req.params.index, req.user.activeRevisionIndex)
    .then(entry => Promise.all([
        Promise.resolve(entry),
        Entry.getAdjacentIndices(req.params.index, req.user.activeRevisionIndex),
    ]))
    .then(([ entry, { previous, next } ]) => res.json({ entry, previous, next }))
    .catch(next)

})


/*
*   Retrieves all Entries.
*/

router.get('/api/entries', isViewer, (req, res, next) => {

    Entry.findAtRevision(null, req.user.activeRevisionIndex)
    .then(entries => res.json(entries))
    .catch(next)

})


/*
*   Updates a single Entry under the latest Revision.
*/

router.patch('/api/entries/:index', isEditor, (req, res, next) => {

    console.log(req.body)
    Entry.findByIndexAndUpdateAtLatest(req.params.index, req.body)
    .then(entry => {
        if (entry) { console.log(entry); res.json(entry) }
        else { throw null /* Triggers the 404 Not Found error handler */ }
    })
    .catch(next)

})


/*
*   Retrieves and returns the entry field definitions.
*/

router.get('/api/entry-fields', isViewer, (req, res, next) => {

    res.json(entryFields)

})


/*
*   Exports
*/

module.exports = router

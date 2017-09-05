(function() {


    /*
    *   Constants
    */

    var MAX_DOT_RADIUS_COEFFICIENT = 1
    var MIN_DOT_RADIUS_COEFFICIENT = 0.5
    var NO_DATA_DOT_RADIUS_COEFFICIENT = 0.25
    var MAX_DOT_RADIUS_IN_KEY = 10


    /*
    *   Describes the different ways dots' appearances can be manipulated.
    */

    var DOT_EFFECTS = {

        color: {
            
            label: 'Dot Color',
            applyDotEffect: function(selection) {

                selection
                .attr('fill', function(d) { return d.color || d3.color('silver') })

            }
        
        },

        size: {
            
            label: 'Dot Size',
            applyDotEffect: function(selection, parameters) {

                var scale = d3.scaleLinear()
                .range([ MIN_DOT_RADIUS_COEFFICIENT * parameters.maxDotRadius, parameters.maxDotRadius ])

                selection
                .attr('r', function(d) {
                    
                    if (d.size === undefined) return parameters.maxDotRadius
                    else if (d.size === null) return parameters.maxDotRadius * NO_DATA_DOT_RADIUS_COEFFICIENT
                    else return scale(d.size)
                
                })

            },
        
        },

        groupingOnly: {
            label: 'Grouping Only',
            applyDotEffect: function() {}
        },

    }


    /*
    *   Describes the different data dimensions that can be visualized.
    */

    var VISUALIZABLE_DIMENSIONS = {

        gender: {
            
            label: 'Gender',
            dotEffect: 'color',


            /*
            *   Returns an array of groupings for the dimension,
            *   each with a label, a sample entry (used to create
            *   the dimension key) and a function to determine if
            *   an entry belongs in the group.
            */

            getGroupings: function() {
                
                return [
                    
                    {
                        label: 'No Data',
                        sampleEntry: {},
                        deselected: true,
                        match: function(entry) { return entry.gender !== 'Man' && entry.gender !== 'Woman' },
                    },
                    
                    {
                        label: 'Male',
                        sampleEntry: { gender: 'Man' },
                        match: function(entry) { return entry.gender === 'Man' },
                    },
                    
                    {
                        label: 'Female',
                        sampleEntry: { gender: 'Woman' },
                        match: function(entry) { return entry.gender === 'Woman' },
                    },
                
                ]
            
            },


            /*
            *   Formats relevant entry data for the dimension and
            *   applies it to the backing dot object.
            */

            getAttributeSetter: function() {

                return function(entry, dot) {

                    if (entry.gender === 'Man') dot.color = d3.color('darkturquoise')
                    else if (entry.gender === 'Woman') dot.color = d3.color('lightsalmon')

                }

            }
        
        },

        entryLength: {
            
            label: 'Entry Length',
            dotEffect: 'size',
            getGroupings: function(entries) {

                //  Constant: number of groups
                const N_GROUPS = 5

                //  Generates array of entry length intervals from entries
                var min = d3.min(entries, function(entry) { return entry.entryLength })
                var max = d3.max(entries, function(entry) { return entry.entryLength })
                var ticks = d3.ticks(min, max, N_GROUPS - 1)
                if (ticks[0] !== min) ticks.unshift(min)
                if (ticks[ticks.length - 1] !== max) ticks.push(max)
                var intervals = d3.pairs(ticks)
                var groupings = intervals.map(function(interval, index) {

                    return {
                        
                        label: interval[0] + ' – ' + interval[1] + ' characters',
                        sampleEntry: { entryLength: (interval[0] + interval[1]) / 2 },
                        match: (
                            index === 0
                            ? function(entry) { return entry.entryLength >= interval[0] && entry.entryLength <= interval[1] }
                            : function(entry) { return entry.entryLength > interval[0] && entry.entryLength <= interval[1] }
                        ),
                    
                    }

                })

                groupings.unshift({
                        
                    label: 'No Data',
                    sampleEntry: {},
                    deselected: true,
                    match: function(entry) { return typeof entry.entryLength !== 'number' },
               
                })

                return groupings

            },

            getAttributeSetter: function(entries) {

                var min = d3.min(entries, function(entry) { return entry.entryLength })
                var max = d3.max(entries, function(entry) { return entry.entryLength })
                var scale = d3.scaleLinear()
                .domain([ min, max ])

                return function(entry, dot) {

                    dot.size = typeof entry.entryLength === 'number' ? scale(entry.entryLength) : null

                }

            }

        },

        travelLength: {
            
            label: 'Travel Length',
            dotEffect: 'size',
            getGroupings: function(entries) {

                //  Constant: number of groups
                const N_GROUPS = 5

                //  Generates array of entry length intervals from entries
                var min = d3.min(entries, function(entry) { return entry.travelLength })
                var max = d3.max(entries, function(entry) { return entry.travelLength })
                var ticks = d3.ticks(min, max, N_GROUPS - 1)
                if (ticks[0] !== min) ticks.unshift(min)
                if (ticks[ticks.length - 1] !== max) ticks.push(max)
                var intervals = d3.pairs(ticks)
                var groupings = intervals.map(function(interval, index) {

                    return {
                        
                        label: interval[0] + ' – ' + interval[1] + ' years',
                        sampleEntry: { travelLength: (interval[0] + interval[1]) / 2 },
                        match: (
                            index === 0
                            ? function(entry) { return entry.travelLength >= interval[0] && entry.travelLength <= interval[1] }
                            : function(entry) { return entry.travelLength > interval[0] && entry.travelLength <= interval[1] }
                        ),
                    
                    }

                })

                groupings.unshift({
                        
                    label: 'No Data',
                    sampleEntry: {},
                    deselected: true,
                    match: function(entry) { return typeof entry.travelLength !== 'number' },
               
                })

                return groupings

            },

            getAttributeSetter: function(entries) {

                var min = d3.min(entries, function(entry) { return entry.travelLength })
                var max = d3.max(entries, function(entry) { return entry.travelLength })
                var scale = d3.scaleLinear()
                .domain([ min, max ])

                return function(entry, dot) {

                    dot.size = typeof entry.travelLength === 'number' ? scale(entry.travelLength) : null

                }

            }

        },

        dateOfFirstTravel: {
            
            label: 'Date of First Travel',
            dotEffect: 'groupingOnly',
            getGroupings: function(entries) {

                //  Constant: number of groups
                const N_GROUPS = 5

                //  Generates array of entry length intervals from entries
                var min = d3.min(entries, function(entry) { return entry.dateOfFirstTravel })
                var max = d3.max(entries, function(entry) { return entry.dateOfFirstTravel })
                var ticks = d3.ticks(min, max, N_GROUPS - 1)
                if (ticks[0] !== min) ticks.unshift(min)
                if (ticks[ticks.length - 1] !== max) ticks.push(max)
                var intervals = d3.pairs(ticks)
                var groupings = intervals.map(function(interval, index) {

                    return {
                        
                        label: interval[0] + ' – ' + interval[1],
                        sampleEntry: { dateOfFirstTravel: (interval[0] + interval[1]) / 2 },
                        match: (
                            index === 0
                            ? function(entry) { return entry.dateOfFirstTravel >= interval[0] && entry.dateOfFirstTravel <= interval[1] }
                            : function(entry) { return entry.dateOfFirstTravel > interval[0] && entry.dateOfFirstTravel <= interval[1] }
                        ),
                    
                    }

                })

                groupings.unshift({
                        
                    label: 'No Data',
                    sampleEntry: {},
                    deselected: true,
                    match: function(entry) { return typeof entry.dateOfFirstTravel !== 'number' },
               
                })

                return groupings

            },

            getAttributeSetter: function(entries) {
                return function() {}
            }

        },

    }


    /*
    *   Registers the 'visualization' directive.
    */

    app.directive('visualizations', function($sce) {
        
        return {
        
            restrict: 'E',
            templateUrl: 'components/visualizations',
            scope: true,
            link: function(scope, element, attributes) {


                /*
                *   Retrieves visualization dimension definitions.
                */

                var dimensionNames = scope.$eval(attributes.dimensions)
                var dimensions = dimensionNames.map(function(name) {

                    var dimension = VISUALIZABLE_DIMENSIONS[name]
                    return {

                        key: name,
                        label: dimension.label,
                        dotEffect: dimension.dotEffect,
                        enabled: false,

                    }

                })

                
                /*
                *   Creates view model for header categorized dimension toggle buttons.
                */

                var dimensionCategories = Object.keys(DOT_EFFECTS).map(function(effectKey) {

                    return {
                        key: effectKey,
                        label: DOT_EFFECTS[effectKey].label,
                        dimensions: dimensions.filter(function(dimension) { return dimension.dotEffect === effectKey }),
                    }

                })


                /*
                *   Updates the visualization if the dimensions,
                *   entries or other state values change.
                */

                scope.$watch('allEntries', function() {


                    dimensions.forEach(function(dimension) {
                        if (scope.allEntries && scope.allEntries.length) {
                            dimension.groupings = VISUALIZABLE_DIMENSIONS[dimension.key].getGroupings(scope.allEntries)
                        }
                    })

                    updateVisualization()

                })
                
                var viewModel = {

                    dimensionCategories: dimensionCategories,
                    dimensions: dimensions,
                    groupedBy: null,
                    hideDeselectedEntries: false,

                }

                scope.viewModel = viewModel
                scope.$watch('viewModel', updateVisualization, true)
                
                /*
                *   Executes an update of the visualization.
                */

                function updateVisualization() {

                    if (scope.allEntries && scope.allEntries.length) {

                        //  Retrieves all entries that haven't been deselected
                        var selectedEntries = markDeselectedEntries(scope.allEntries, dimensions)
                        var visibleEntries = viewModel.hideDeselectedEntries ? selectedEntries : scope.allEntries

                        //  Updates attribute setters based on selected entries
                        dimensions.forEach(function(dimension) {
                            dimension.setAttributes = VISUALIZABLE_DIMENSIONS[dimension.key].getAttributeSetter(visibleEntries)
                        })

                        //  Applies updates to dots
                        var canvas = d3.select('.canvas svg')
                        var parameters = setParameters(canvas, visibleEntries, viewModel.groupedBy)
                        var dots = setDotAttributes(visibleEntries, dimensions, parameters)
                        updateDots(canvas, dots, parameters)
                        if (viewModel.groupedBy) {
                            
                            var grid = calculateDotGrid(dots, viewModel.groupedBy)
                            placeLabelsAndLines(grid)
                            moveDotsToGridLocation(grid, dots)
                        
                        } else {

                            moveDotsToInitialLocation(dots)
                            respaceDots(dots)

                        }

                        //  Saves selected entries in parent controller
                        scope.updateEntries(visibleEntries)
                        console.log(visibleEntries && visibleEntries.length)

                    } 

                }


                /*
                *   Toggles a dimension in the header, ensuring that only
                *   one from each effect group is selected.
                */

                scope.toggleDimensionEnabled = function(dimension, category) {

                    var newValue = !dimension.enabled
                    if (newValue && category.key !== 'groupingOnly') category.dimensions.forEach(function(dimension) {
                        dimension.enabled = false
                    })

                    if (!newValue && viewModel.groupedBy === dimension) viewModel.groupedBy = null
                    dimension.enabled = newValue

                }


                /*
                *   Creates a single dot for a grouping in the dimension
                *   key, returning SVG code.
                */

                scope.getKeyDot = function(dimension, grouping) {

                    var parameters = {
                        canvasWidth: MAX_DOT_RADIUS_IN_KEY * 2,
                        canvasHeight: MAX_DOT_RADIUS_IN_KEY * 2,
                        maxDotRadius: MAX_DOT_RADIUS_IN_KEY,
                    }

                    //  Creates a sample dot object, based off of all entries
                    var dot = { initialPosition: [ 0, 0 ] }
                    VISUALIZABLE_DIMENSIONS[dimension.key].getAttributeSetter(scope.allEntries)(grouping.sampleEntry, dot)
                    
                    //  Creates a little SVG
                    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                    
                    //  Creates an in-memory SVG canvas
                    var canvas = d3.select(svg)
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('viewBox', [ -MAX_DOT_RADIUS_IN_KEY, -MAX_DOT_RADIUS_IN_KEY, 2 * MAX_DOT_RADIUS_IN_KEY, 2 * MAX_DOT_RADIUS_IN_KEY ].join(' '))
                    
                    //  Creates dot
                    updateDots(canvas, [ dot ], parameters)

                    //  Returns SVG code
                    return $sce.trustAsHtml(svg.outerHTML)

                }


            },
        
        }

    })


    /*
    *   Returns entries that match the currently-selected dimension
    *   filter options.
    */

    function markDeselectedEntries(entries, dimensions) {

        entries.forEach(function(entry) {

            var deselected = false
            dimensions.filter(function(dimension) { return dimension.enabled }).forEach(function(dimension) {

                if (!deselected) {
                    
                    dimension.groupings.filter(function(grouping) { return grouping.deselected }).forEach(function(grouping) {

                        if (!deselected) deselected = grouping.match(entry)
                    
                    })

                }

            })

            entry.deselected = deselected

        })

        return entries.filter(function(entry) { return !entry.deselected })

    }


    /*
    *   Sets initial visualization parameters (dot size, etc) and
    *   clears elements no longer needed.
    */

    function setParameters(canvas, entries, groupedBy) {

        var rect = canvas.node().getBoundingClientRect()
        var canvasWidth = rect.width
        var canvasHeight = rect.height
        var maxDotRadius = Math.sqrt((canvasWidth * canvasHeight) / entries.length) / Math.PI * MAX_DOT_RADIUS_COEFFICIENT
        return {
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            maxDotRadius: maxDotRadius,
        }

    }


    /*
    *   Updates the array of objects, each representing a dot in
    *   the visualiztion, with new attribute data based on the dimensions
    *   currently enabled.
    */

    function setDotAttributes(entries, dimensions, parameters) {

        return entries.map(function(entry) {

            var dot = {}
            dimensions.filter(function(dimension) { return dimension.enabled })
            .forEach(function(dimension) {

                dimension.setAttributes(entry, dot)

            })

            dot.initialPosition = [
                (parameters.canvasWidth - (4 * parameters.maxDotRadius)) * Math.random() + (2 * parameters.maxDotRadius),
                (parameters.canvasHeight - (4 * parameters.maxDotRadius)) * Math.random() + (2 * parameters.maxDotRadius),
            ]

            dot.deselected = entry.deselected

            return dot

        })

    }


    /*
    *   Using the updated dot data, updates the SVG dot elements
    *   based on their updated attribute values.
    */

    function updateDots(canvas, dots, parameters) {

        var selection = canvas.selectAll('circle')
        .data(dots)

        //  Removes old dots
        selection.exit()
        .remove()

        //  Creates new dots
        var updateSelection = selection.enter()
        .append('circle')
        .attr('cx', function(d) { return d.initialPosition[0] })
        .attr('cy', function(d) { return d.initialPosition[1] })
        .merge(selection)
        .attr('opacity', function(d) { return d.deselected ? .25 : 1 })
        
        //  Updates dots
        Object.values(DOT_EFFECTS).forEach(function(effect) {

            effect.applyDotEffect(updateSelection, parameters)

        })

    }


    /*
    *   Calculates the extents of the grid used when dots are grouped,
    *   setting dot and label locations.
    */

    function calculateDotGrid(dots, groupedBy) {

        // console.log('calculating dot grid')
        return {}

    }


    /*
    *   Places labels and lines for the grouped dots.
    */

    function placeLabelsAndLines(grid) {

        // console.log('placing labels and lines')

    }


    /*
    *   Places labels and lines for the grouped dots.
    */

    function moveDotsToGridLocation(grid, dots) {

        // console.log('moving dots to grid location')

    }


    /*
    *   Moves dots to their initial (random) locations.
    */

    function moveDotsToInitialLocation(dots) {

        // console.log('moving dots to initial location')

    }


    /*
    *   Performs a force simulation to space dots appropriately
    *   based on their random locations.
    */

    function respaceDots(dots) {

        // console.log('respacing dots')

    }


})()
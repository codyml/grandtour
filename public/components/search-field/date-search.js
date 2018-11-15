app.directive('dateSearch', function() {
    
    return {
    
        restrict: 'E',
        templateUrl: 'components/search-field/date-search',
        scope: {
            title: "@",
            field: '@'
        },
        link: function (scope, elm, attrs) {
            window.scope = scope;
            /*
            *   Resets travel date model.
            */

            function resetTravelSearch(type) {
                
                scope.dateModel = { date: { queryType: type, query: {} } }
                if (scope.$parent.query[scope.field]) {
                    if (scope.$parent.query[scope.field]) {
                        if (scope.$parent.query[scope.field].startYear !== scope.$parent.query[scope.field].endYear) {
                            scope.dateModel.date.queryType = 'range'
                        }
                        scope.dateModel.date.query = scope.$parent.query[scope.field]
                    }
                
                }
            
            }

            
            /*
            *   Updates the travel model and main query in response
            *   to $watch or manual trigger.
            */

            function handleTravelSearchUpdate() {
                
                if (scope.dateModel.date.queryType === 'exact') {
                    scope.dateModel.date.query.endYear = scope.dateModel.date.query.startYear
                    // scope.dateModel.date.query.endMonth = scope.dateModel.date.query.startMonth
                }
                
                for (key in scope.dateModel.date.query) if (!scope.dateModel.date.query[key]) delete scope.dateModel.date.query[key]
                if (Object.getOwnPropertyNames(scope.dateModel.date.query).length > 0) {
                    
                    scope.$parent.query[scope.field] = scope.$parent.query[scope.field] || { date: { queryType: scope.dateModel.date.queryType } }
                    scope.$parent.query[scope.field] = scope.dateModel.date.query
                
                } else if (scope.$parent.query[scope.field]) delete scope.$parent.query[scope.field]
                
                if (scope.$parent.query[scope.field] && !scope.$parent.query[scope.field]) delete scope.$parent.query[scope.field]
            
            }

            
            /*
            *   Sets up travel model and links to main query object.
            */

            function setupTravelSearch() {

                resetTravelSearch('exact')
                // scope.title = elm[0].dataset['title'];
                window.scope = scope;
                window.elm = elm;
                scope.$watch('dateModel', handleTravelSearchUpdate, true)
                scope.$watch('query.travel', resetTravelSearch.bind(null, 'exact'), true)

            }
            setupTravelSearch()
        
        },
    
    }

})

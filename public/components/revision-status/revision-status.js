app.directive('revisionStatus', function($http, $window) {
    
    return {
    
        restrict: 'E',
        templateUrl: 'components/revision-status',
        scope: {},
        link: function (scope, element) {
        
          /*
          * Sets up Revisions tab.
          */
        
            function processRevisions(activeIndex) {
              
                scope.revisions.forEach(function(revision, i) {
                
                    revision.latest = i === 0
                    revision.active = revision.index === activeIndex || (revision.latest && !activeIndex)
                    if (revision.active) scope.activeRevision = revision
                
                })
                
                scope.revisions = scope.revisions
            
            }
            
            
            function reloadRevisions() {
              
                $http.get('/api/revisions')
                .then(function(response) {
                    scope.revisions = response.data
                })
                .then(function() { return $http.get('/loggedin') })
                .then(function(response) {
                    processRevisions(response.data.activeRevisionIndex)
                })
                .catch(console.error.bind(console))
            
            }
            
            scope.setActiveRevision = function(revision) {
                
                revision.activating = true
                $http.post('/api/users/update', { activeRevisionIndex: revision.latest ? null : revision.index })
                .then(function(response) {
                    revision.activating = false
                    $window.location.reload()
                })
                .catch(console.error.bind(console))
            
            }
            
            reloadRevisions()
        
        },
    
    }

})

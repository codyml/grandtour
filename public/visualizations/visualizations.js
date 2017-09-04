app.controller('VisualizationsCtrl', function($scope, entryListContext, $http) {


    /*
    *   Retrieves starting set of entry data.
    */

    var entryIndexString = ''
    var context = entryListContext.getContext()
    if (context) entryIndexString = '/' + encodeURIComponent(JSON.stringify(context.entryIndexes))
    $http.get('/api/entries/for-visualization' + entryIndexString)
    .then(function(response) {

        var entries = response.data
        $scope.allEntries = entries
        $scope.selectedEntries = entries

    })
    .catch(console.error.bind(console))


    /*
    *   Export function copied from Explore.
    */

    $scope.export = function() {

        var $btn = $('#export-button').button('loading');
    
        $http.post('/api/entries/export/', { query: $scope.query } )
        .success(function(res) {
    
            var entries = d3.tsv.format(res.result.entries);
            var activities = d3.tsv.format(res.result.activities);
            var travels = d3.tsv.format(res.result.travels);
        
            var zip = new JSZip();
            zip.file("Entries.tsv", entries);
            zip.file("Activities.tsv", activities);
            zip.file("Travels.tsv", travels);
            var content = zip.generate({ type: "blob" });
            saveAs(content, "Grand Tour Explorer - Export.zip");
            $btn.button('reset');
    
        });
    }


})

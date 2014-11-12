"use strict";

var client = new $.es.Client({host: 'http://localhost:9200'});
$(document).ready(function() {
    $("#runsearch").on("click", function() {
        client.search({index:'nih', type:'small', body: searchJSON}).then(function(resp) {
        });
    });

    $("#runquery").on("click", function() {
        var searchBody = {};
        var searchText = $("#searchquery").val();
        if (searchText) {
            searchBody.query = JSON.parse(searchText);
        }
        var aggregationText = $("#aggregations").val();
        if (aggregationText) {
            searchBody.aggs = JSON.parse(aggregationText);
        }
        client.search({index:'nih', type:'small', body: searchBody}).then(function(resp) {
            console.log(resp);
            var $results = $("#searchresults");
            $results.empty();
            // Show the matching documents
            _.forEach(resp.hits.hits, function(hit) {
                var title = hit._source.title;
                $results.append("<li>" + title + "</li>");
            });
            // Show the aggregation results
            var $aggresults = $("#aggresults");
            $aggresults.empty();
            if (resp.aggregations) {
                _.forOwn(resp.aggregations, function(agg, name){
                    $aggresults.append("<h2>"+name+"</h2><ul>");
                    _.forEach(agg.buckets, function(bucket){
                        $aggresults.append("<li>" + bucket.key + " - " + bucket.doc_count + "</li>");
                    });
                    $aggresults.append("</ul>");
                });
            }
        });
    });
});

"use strict";


$(document).ready(function() {
    var client = new $.es.Client({host: 'http://localhost:9200'});
    var ctx = $("#myChart").get(0).getContext("2d");
    Chart.defaults.global.animation = false;
    var instituteBarChart = undefined;

    function updateInstitute(buckets) {
        var barData = {
            labels: [],
            datasets: [
                {
                    label: "My First dataset",
                    fillColor: "rgba(220,220,220,0.5)",
                    strokeColor: "rgba(220,220,220,0.8)",
                    highlightFill: "rgba(220,220,220,0.75)",
                    highlightStroke: "rgba(220,220,220,1)",
                    data: []
                }
            ]
        };
        _.forEach(buckets, function(bucket) {
            barData.labels.push(bucket.key);
            barData.datasets[0].data.push(bucket.doc_count);
        });
        if (instituteBarChart !== undefined) {
            instituteBarChart.destroy();
        }
        instituteBarChart = new Chart(ctx).Bar(barData);
    }

    $("#runquery").on("click", function() {
        var searchBody = {};
        var searchText = $("#searchquery").val();
        if (searchText) {
            searchBody.query = { "match": JSON.parse(searchText) };
        }
        var aggregationText = $("#aggregations").val();
        if (aggregationText) {
            searchBody.aggs = JSON.parse(aggregationText);
        } else {
            searchBody.aggs = {};
        }
        // Add the per-institute aggregation
        searchBody.aggs.institutes = {
          "terms": {
            "field": "funding_institute",
            "size": 15
          }, "aggregations": {
            "cost_stats": {
              "stats": {"field":"total_cost"}
            }
          }
        };

        // Do the Dew!
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
                    if (name === "institutes") {
                        updateInstitute(agg.buckets);
                    } else {
                        $aggresults.append("<h2>"+name+"</h2><ul>");
                        _.forEach(agg.buckets, function(bucket){
                            $aggresults.append("<li>" + bucket.key + " - " + bucket.doc_count + "</li>");
                        });
                        $aggresults.append("</ul>");
                    }
                });
            }
        });
    });
});

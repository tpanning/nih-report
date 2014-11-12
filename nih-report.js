"use strict";


$(document).ready(function() {
    var client = new $.es.Client({host: 'http://localhost:9200'});
    Chart.defaults.global.animation = false;
    var instituteChartCtx = $("#instituteChart").get(0).getContext("2d");
    var instituteBarChart = undefined;
    var timelineCtx = $("#timelineChart").get(0).getContext("2d");
    var timelineChart = undefined;

    function updateInstitute(buckets) {
        var barData = {
            labels: [],
            datasets: [
                {
                    label: "My First dataset",
                    fillColor: "rgba(15,62,136,0.5)",
                    strokeColor: "rgba(15,62,136,0.8)",
                    highlightFill: "rgba(15,62,136,0.75)",
                    highlightStroke: "rgba(15,62,136,1)",
                    data: []
                }
            ]
        };
        _.forEach(buckets, function(bucket) {
            barData.labels.push(bucket.key);
            barData.datasets[0].data.push(bucket.doc_count);
        });
        // Destroy the last chart. Wasteful, but easier than updating the data in place.
        if (instituteBarChart !== undefined) {
            instituteBarChart.destroy();
        }
        instituteBarChart = new Chart(instituteChartCtx).Bar(barData);
    }

    function updateTimeline(buckets) {
        var timelineData = {
            labels: [],
            datasets: [
                {
                    label: "My First dataset",
                    fillColor: "rgba(15,62,136,0.2)",
                    strokeColor: "rgba(15,62,136,1)",
                    pointColor: "rgba(15,62,136,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: [65, 59, 80, 81, 56, 55, 40]
                }
            ]
        };
        _.forEach(buckets, function(bucket) {
            // Iterating over the buckets and using them as the data points runs into problems if
            // there are months that have no matching records. Elasticsearch will not return a
            // bucket for those months, so we'll inadvertently skip them. So if there is no data for
            // Feb 2014, then the graph will go from Jan 2014 to Mar 2014 and connect the dots as if
            // that makes sense, instead of putting a 0 between them at Feb.
            var date = moment(bucket.key_as_string);
            timelineData.labels.push(date.format("MMM YY"));
            timelineData.datasets[0].data.push(bucket.doc_count);
        });
        if (timelineChart !== undefined) {
            timelineChart.destroy();
        }
        timelineChart = new Chart(timelineCtx).Line(timelineData);
    }

    function updateSignificantTerms(buckets) {
        // Get the min and max counts for scaling purposes
        var fromDocCount = function(bucket) { return bucket.doc_count; };
        var minCount = _.min(buckets, fromDocCount).doc_count;
        var maxCount = _.max(buckets, fromDocCount).doc_count;
        var $significantTerms = $("#significant_terms");
        $significantTerms.empty();
        _.forEach(buckets, function(bucket) {
            var $term = $("<span></span>");
            $term.append(bucket.key);
            var scaling = (bucket.doc_count - minCount) / (maxCount - minCount);
            var fontSize = (scaling * 20 + 12) + "pt";
            $term.css({
                "font-size": fontSize,
                "padding": "5px"
            });
            $significantTerms.append($term);
            $significantTerms.append(" ");
        });
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
        // Add the significant terms aggregation
        searchBody.aggs.significant_terms = {
            "significant_terms": {
                "field": "terms",
                "size": 25
            }
        };
        // Add the monthly aggregation
        searchBody.aggs.monthly = {
            "date_histogram": {
                "field": "award_notice_date",
                "interval": "month"
            }, "aggregations": {
                "cost_stats": {
                    "stats": {
                        "field": "total_cost"
                    }
                }
            }
        };

        function numberWithCommas(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        // Do the Dew!
        client.search({index:'nih', type:'full', body: searchBody}).then(function(resp) {
            console.log(resp);
            // Show the total number of matches
            var $resultcount = $("#resultcount");
            $resultcount.empty();
            $resultcount.append(numberWithCommas(resp.hits.total) + " results");
            // Show the matching documents
            var $results = $("#searchresults");
            $results.empty();
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
                    } else if (name === "significant_terms") {
                        updateSignificantTerms(agg.buckets);
                    } else if (name === "monthly") {
                        updateTimeline(agg.buckets);
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

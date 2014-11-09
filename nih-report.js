"use strict";

var client = new $.es.Client({host: 'http://192.168.59.103:9200'});
$(document).ready(function() {
    $("#submit").on("click", function() {
        var queryText = JSON.parse($("#query").val());
        client.search({index:'nih', type:'small', body: queryText}).then(function(resp) {
            var $results = $("#results");
            $results.empty();
            $results.append("<ul>");
            _.forEach(resp.hits.hits, function(hit) {
                var title = hit._source.title;
                $results.append("<li>" + title + "</li>");
            });
            $results.append("</ul>");
        });
    });
});

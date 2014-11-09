"use strict";

var client = new $.es.Client({host: 'http://192.168.59.103:9200'});
$(document).ready(function() {
    $("#submit").on("click", function() {
        var queryText = JSON.parse($("#query").val());
        console.log(queryText);
        client.search({index:'nih', type:'small', body: queryText}).then(function(resp) {
            console.log(resp.hits)
        });
    });
});

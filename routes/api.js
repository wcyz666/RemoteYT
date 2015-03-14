var express = require('express');
var router = express.Router();
var http = require('http');

router.get("/add", function(req, res, next){
    res.status(401);
    res.send("Bad Request. You cannot use GET method to retrieve this API");
});

router.post("/add", function(req, res, next){
    var vid = req.body.vid || "";
    http.get("http://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=" + vid, function(response) {
        response.setEncoding('utf8');
        if (response.statusCode == 200)
            response.on('data', function (chunk) {
                var info = JSON.parse(chunk.replace(/\\U\d*/g, ""));
                var title =  info.title;
                res.json({"status": response.statusCode, "title": title});
            });
        else
            response.on('data', function (e) {
                res.json({"status": response.statusCode});
            });
    });
});

module.exports = router;

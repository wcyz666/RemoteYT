/**
 * Created by lenovo on 2015/3/2.
 */
(function(){

    var myLib = window.myLib = (window.myLib || {});


    // To generate GET parameters based on properties of an object
    var encodeParam = function(obj) {
        var data = [];
        for (var key in obj)
            data.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        return data.join('&');
    }

    // To generate POST parameters based on input controls of a form object
    var formData = function(form) {
        // private variable for storing parameters
        this.data = [];
        for (var i = 0, j = 0, name, el, els = form.elements; el = els[i]; i++) {
            // skip those useless elements
            if (el.disabled || el.name == ''
                || ((el.type == 'radio' || el.type == 'checkbox') && !el.checked))
                continue;
            // add those useful elements to the data array
            this.append(el.name, el.value);
        }
    };

    formData.prototype.toString = function(){
        return this.data.join('&');
    };

    formData.prototype.append = function(key, val){
        this.data.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
    };

    // The base class of AJAX/XMLHttpRequest feature
    myLib.ajax = function(opt) {
        opt = opt || {};
        var xhr = (window.XMLHttpRequest)
                ? new XMLHttpRequest()                     // IE7+, Firefox1+, Chrome1+, etc
                : new ActiveXObject("Microsoft.XMLHTTP"),  // IE 6
            async = opt.async !== false,
            success = opt.success || null,
            error = opt.error || function(){alert('AJAX Error: ' + this.status)};

        // pass three parameters, otherwise the default ones, to xhr.open()
        xhr.open(opt.method || 'GET', opt.url || '', async);

        if (opt.method == 'POST')
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        // Asyhronous Call requires a callback function listening on readystatechange
        if (async)
            xhr.onreadystatechange = function(){
                if (xhr.readyState == 4) {
                    var status = xhr.status, response = xhr.responseText;
                    if ((status >= 200 && status < 300) || status == 304 || status == 1223) {
                        success && success.call(xhr, (response.substr(0,9) == 'while(1);') ? response.substring(9) : response);
                    } else if (status >= 500)
                        error.call(xhr);
                }
            };
        xhr.onerror = function(){error.call(xhr)};

        // POST parameters encoded as opt.data is passed here to xhr.send()
        xhr.send(opt.data || null);
        // Synchronous Call blocks UI and returns result immediately after xhr.send()
        !async && callback && callback.call(xhr, xhr.responseText);
    };

    // To get some content in JSON format with AJAX
    myLib.processJSON = function(url, param, successCallback, opt) {
        opt = opt || {};
        opt.url = url;
        opt.method = opt.method || 'GET';
        if (param)
            opt.data = encodeParam(param);
        opt.success = function(json){
            json = JSON.parse(json);
            if (json.success)
                successCallback && successCallback.call(this, json.success);
            else
                alert('Error: ' + json.failed);
        };
        myLib.ajax(opt);
    };

    myLib.get = function(param, successCallback) {
        param = param || {};
        param.rnd =  new Date().getTime(); // to avoid caching in IE
        myLib.processJSON('admin-process.php?' + encodeParam(param), null, successCallback);
    };
    // To send an action to the admin-process.php over AJAX
    myLib.post = function(param, successCallback) {
        myLib.processJSON('admin-process.php?rnd=' + new Date().getTime(), param, successCallback, {method:'POST'});
    };

    // To validate if a form passes the client-side restrictions
    myLib.validate = function(form) {
        return true;
    };

    // Given a form that passed the client-side restrictions,
    //   submit the parameters based on input controls of a form object over AJAX,
    //     and calls the successCallback upon server response
    myLib.submit = function(form, successCallback) {
        myLib.validate(form) && myLib.ajax({
            method: 'POST',
            url: form.getAttribute('action'),
            data: new formData(form).toString(),
            success: function(json){
                json = JSON.parse(json);
                if (json.success)
                    successCallback && successCallback.call(this, json.success);
                else
                    alert('Error: ' + json.failed);
            }
        });
        return false;
    };

})();



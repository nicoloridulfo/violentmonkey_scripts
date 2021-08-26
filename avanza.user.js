// ==UserScript==
// @name         Avanza Shortcuts
// @version      1.0
// @description  Some keyboard shortcuts for avanza
// @match        https://www.avanza.se/*
// @icon         https://www.avanza.se/frontend/image/pwa/favicon.ico
// @grant        none
// @require https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==


/*
 If the user is in the "kurslarm" page, then a red border will be added to the 
 triggered alerts that are still above the triggered price.
 This can be used at the end of the day to see which alerts are still active.
 NB! Only today's alerts will be checked.
*/
if (window.location.href.includes("kurslarm")) {
    var today = new Date().toISOString().slice(0, 10)
    var table = document.getElementsByClassName("triggeredPriceAlerts")[0]
    for (var i = 1, row; row = table.rows[i]; i++) {
        cells = row.cells;
        var trigger_date = cells[4].innerHTML.split(" ")[0];
        if (trigger_date != today) break;
        var orderbookId = row.getAttribute("data-oid");
        $.ajax({
            type: 'GET',
            url: "https://www.avanza.se/_api/price-chart/stock/" + orderbookId + "?timePeriod=today",
            async: false,
            success: function (data, textStatus, request) {
                data = data.ohlc;
                var last_price = data[data.length - 1].close;
                var trigger_price = parseFloat(cells[2].innerText.replace(",", "."));
                if(cells[1].innerText == "Över eller lika med" && last_price >= trigger_price ||
                    cells[1].innerText == "Under eller lika med" && last_price <= trigger_price) {

                    cells[2].innerText = cells[2].innerText + " Now: " + String(last_price).replace(".", ",");
                    row.style.outline = "solid red";
                }
            }
        });
    }
}

/*
Help menu
*/
document.addEventListener('keydown', event => {
    // pressed alt+s
    if (event.altKey && event.code === 'KeyH') {
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            // Gets the orderbookid, this is needed to set the alert
            message = `
            Shortcuts:
            alt + H = help
            alt + S = Search
            alt + A = place alert
            alt + shift + A = place alert at the high of the hovered upon bar on the ohlc chart
            `;
            alert(message);
        }
    }
});

/*
This shortcut allows the user to immediately go to a stock though a prompt.
*/
document.addEventListener('keydown', event => {
    // pressed alt+s
    if (event.altKey && event.code === 'KeyS') {
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            // Gets the orderbookid, this is needed to set the alert
            $.ajax({
                type: 'GET',
                url: "https://www.avanza.se/_cqbe/search/global-search/global-search-template?query=" + prompt("Stock"),
                success: function (data, textStatus, request) {
                    orderbookid = data["resultGroups"][0]["hits"][0]["link"]["orderbookId"]; // Get the first result
                    window.location.replace("https://www.avanza.se/aktier/om-aktien.html/" + orderbookid)
                }
            });
        }
    }
});

/*
Allows the user to add an alert from any page by specifing the stock and the price.
NB! The price should use a dot for decimals.
*/
document.addEventListener('keydown', event => {
    // pressed alt+s
    if (event.altKey && event.code === 'KeyA') {
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {

            // Gets the orderbookid, this is needed to set the alert
            $.ajax({
                type: 'GET',
                url: "https://www.avanza.se/_cqbe/search/global-search/global-search-template?query=" + prompt("Stock"),
                success: function (data, textStatus, request) {
                    let confirmAction = confirm('Did you mean "' + data["resultGroups"][0]["hits"][0]["link"]["linkDisplay"] + '" ?');
                    if (!confirmAction) {
                        return;
                    }
                    orderbookid = data["resultGroups"][0]["hits"][0]["link"]["orderbookId"]; // Get the first result
                    var oneYearFromNow = new Date();
                    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                    data = {
                        "price": parseFloat(prompt("Price:")),
                        "validUntil": oneYearFromNow.toISOString().slice(0, 10),
                        "notification": true
                    }
                    $.ajax({
                        type: "POST",
                        url: "https://www.avanza.se/_cqbe/marketing/service/alert/" + orderbookid,
                        data: JSON.stringify(data),
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        headers: {
                            Accept: "application/json, text/plain",
                        },
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("x-securitytoken", request.getResponseHeader("x-securitytoken"));
                        },
                        success: function (data, textStatus, request) { alert("Successful!"); }
                    });
                }
            });
        }
    }
});

/*
Allows the used to place an alert by hovering over a bar on the ohlc chart.
The alert will be placed on the high of the bar.
TODO: Add so that the user can place the alert on any of the OHLC prices.
*/
document.addEventListener('keydown', event => {
    // pressed alt+shift+s
    if (event.altKey && event.code === 'KeyA') {
        if (event.shiftKey && !event.ctrlKey && !event.metaKey) {

            // Gets the orderbookid from gamla chart sidan, this is needed to set the alert
            orderbookid = document.getElementsByClassName("opt-out-link ng-tns-c252-6")[0].href.split("/")[5]
            // The price from the chart popup box
            var price = document.getElementsByClassName("ohlc-list")[0].children[1].children[1].innerHTML.replace(",", ".");
            var oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            data = {
                "price": parseFloat(price),
                "validUntil": oneYearFromNow.toISOString().slice(0, 10),
                "notification": true
            }
            $.ajax({
                type: "POST",
                url: "https://www.avanza.se/_cqbe/marketing/service/alert/" + orderbookid,
                data: JSON.stringify(data),
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                headers: {
                    Accept: "application/json, text/plain",
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("x-securitytoken", getCookie("aza-usertoken"));
                },
                success: function (data, textStatus, request) { alert("Successful!"); }
            });
        }
    }
});

/*
This is a utility function is used to get the cookie from the browser.
It can be used by any function that needs to get the cookie.
*/
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
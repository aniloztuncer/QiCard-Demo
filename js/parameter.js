/* Parameter JS */
/* ?name=Rıfat&webView=false&membercode=01644843440658 */

function getAllParameters() {
    let params = {};
    let queryString = window.location.search.substring(1); 
    if (queryString) {
        let paramPairs = queryString.split("&"); 

        paramPairs.forEach(pair => {
            let [key, value] = pair.split("=");
            // HTML Injection ve XSS'e karşı güvenlik
            key = decodeURIComponent(key);
            value = decodeURIComponent(value || "");
            
            // Parametreleri HTML'den kaçırarak güvenli hale getirme
            params[DOMPurify.sanitize(key)] = DOMPurify.sanitize(value); 
        });
    }

    return params; 
}


var parameters = getAllParameters();
// Language parameter

var pLanguage = parameters['appLanguage'];
if(!pLanguage || pLanguage.length < 1) { 
    pLanguage = "en";
}
else {
	pLanguage = pLanguage.slice(0,2);
}

// Queue parameter

var pQueue = parameters['queue'];

if(!pQueue || pQueue.length < 1) { 
    pQueue = "Cx_Test"; 
}

// Other parameter

var pUserData = parameters['userdata'];
var pBaseUrl = parameters['getParameter'] ? parameters['getParameter'] : window.location.origin;
/*
var pDisplayName = getParameter('displayname');
var pFirstName = getParameter('firstname');
var pLastName = getParameter('lastname');
var pEmail = getParameter('email');
var pPhone = getParameter('phone');
var pAvatarImageUrl = getParameter('avatarimageurl');
var pCustomFields = getParameter('customfields');
*/
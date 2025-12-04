var authServerUrl = "/TokenService";

async function checkToken(token) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET",
            url: authServerUrl + "/api/Token/CheckToken" + "?token=" + token,
            success: function(data, textStatus, request) {
                if (data.status == "success") {
                    resolve(data);
                }
                else {
                    console.log(data);
                    reject(false);
                }
            },
            error: function(data, textStatus, error) {
                console.log(data);
                reject(false);
                //alert("An error occurred while connecting to the chat. Please check your connection settings and try again.");
            }
        });
    });
}

    function checkAuth() {
        const _parameters = getAllParameters();
        var token = _parameters['token'];
        
        checkToken(token).then(function(data) {
            if (data.tokenValidate) {
                $("#mainContainer").removeClass("cx-hidden");
                startNewChat(data.message);
            } else {
                $(".cx-modals").removeClass("cx-hidden");
                $(".cx-modal-nonauth").removeClass("cx-hidden");
                $("#mainContainer").remove();
            }
        }).catch(function(err) {
            $(".cx-modals").removeClass("cx-hidden");
            $(".cx-modal-nonauth").removeClass("cx-hidden");
            $("#mainContainer").remove();
        });
    }

    function generateGuestId() {
        const now = new Date();

        const year   = now.getFullYear();
        const month  = String(now.getMonth() + 1).padStart(2, '0');
        const day    = String(now.getDate()).padStart(2, '0');
        const hour   = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');

        // YYYYMMDDHHmmss
        const dateTimePart = `${year}${month}${day}${hour}${minute}${second}`;

        // Son ID
        const guestId = `guest_${dateTimePart}`;

        return guestId;
    }
    
    $(document).ready(function(){
        //checkAuth();
        $("#mainContainer").removeClass("cx-hidden");
        
        var startJson = {
            uuid: generateGuestId(),
            name: "CX LTD.",
            firstName: "CX",
            lastName: "LTD.",
            email: "info@cxltd.com",
            phoneNumber: "+1234567890",
            dateOfBirth: "1990-01-01",
            mainCategory: "General Inquiry",
            subCategory: "Product Information",
            platform: "Web",
            memberId: "M123456",
            appLanguage: "en"
        };

        startNewChat(JSON.stringify(startJson));
    });
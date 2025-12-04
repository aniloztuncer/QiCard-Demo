// cxbotcontroller.js
async function sendBotMessage(displayName, email, firstName, lastName, question) {
    const _parameters = getAllParameters();
    var token = _parameters['token'];

    const url = "/TokenService/api/Token/BotSendMessage?tkn=" + token;

    // Gönderilecek JSON body
    const body = {
        "payload": {
            "display_name": displayName,
            "email": email + "@qi.iq",
            "first_name": firstName,
            "last_name": lastName,
            "question": question,
            "custom_fields": {
                "channel": "mobileapp"
            }
        }
    };

    try {
        // URL'ye POST isteği at
        let response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Yanıtı döndür
    } catch (error) {
        console.error("Hata oluştu:", error.message);
        return null; // Hata durumunda null döndür
    }
}

console.log("auth.js is running...");

const SERVER_URL = "https://bc70388f-0e26-4813-ab13-37f4df865c3e-00-2zciwgkuxumc9.kirk.replit.dev";
const REVOKED_TOKENS_URL = "https://goodstudyguides.netlify.app/revoked-tokens.json";
const TOKEN_KEY = "activation_token";

// Load FingerprintJS
async function getFingerprint() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
}

function promptForCode() {
    return prompt("Enter your activation code:");
}

function loadGame() {
    const script = document.createElement("script");
    script.src = "main.js";
    document.body.appendChild(script);
}

async function checkTokenRevocation(token) {
    try {
        const response = await fetch(REVOKED_TOKENS_URL);
        if (!response.ok) throw new Error("Failed to fetch revoked tokens");

        const contentType = response.headers.get("content-type");
        if (!contentType.includes("application/json")) throw new Error("Invalid token list format");

        const data = await response.json();
        const revokedTokens = Array.isArray(data) ? data : (data.revoked || []);
        return revokedTokens.includes(token);
    } catch (error) {
        console.error("Token check failed:", error);
        return false; // Fail open if revocation list is unreachable
    }
}

async function activateUser() {
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
        const revoked = await checkTokenRevocation(existingToken);
        if (revoked) {
            alert("Access revoked. Please re-activate.");
            localStorage.removeItem(TOKEN_KEY);
            location.reload();
            return;
        } else {
            console.log("Token is valid.");
            loadGame();
            return;
        }
    }

    const code = promptForCode();
    if (!code) {
        alert("Activation code is required.");
        return;
    }

    try {
        const fingerprint = await getFingerprint();
        const response = await fetch(`${SERVER_URL}/activate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, fingerprint })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem(TOKEN_KEY, data.token);
            console.log("Activation successful. Token stored.");
            loadGame();
        } else {
            alert("Activation failed: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Error contacting activation server:", err);
        alert("Error contacting activation server.");
    }
}

activateUser();

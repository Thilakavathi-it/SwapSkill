// =====================================================
// SKILLSWAP - LOGIN & SIGNUP
// =====================================================


// SIGNUP
const signupForm = document.querySelector(".signup-container .auth-form");

if (signupForm) {

    signupForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;
        const teachSkill = document.getElementById("skill").value.trim();
        const learnSkill = document.getElementById("learn").value.trim();

        // Check passwords
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Create user object
        const user = {
            name: name,
            email: email,
            password: password,
            teachSkill: teachSkill,
            learnSkill: learnSkill
        };

        // Save user
        localStorage.setItem("skillSwapUser", JSON.stringify(user));

        alert("Account created successfully! 🎉");

        // Go to login
        window.location.href = "login.html";
    });
}


// LOGIN
const loginForm = document.querySelector(".auth-page .auth-form");

if (
    loginForm &&
    !document.querySelector(".signup-container")
) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        // Get saved user
        const savedUser = localStorage.getItem("skillSwapUser");

        if (!savedUser) {
            alert("No account found. Please sign up first.");
            return;
        }

        const user = JSON.parse(savedUser);

        // Check login details
        if (email === user.email && password === user.password) {

            localStorage.setItem("loggedIn", "true");

            alert("Login successful! 🎉");

            window.location.href = "dashboard.html";

        } else {

            alert("Incorrect email or password!");

        }
    });
}
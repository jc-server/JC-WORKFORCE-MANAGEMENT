// Login Component
export class Login {
    render() {
        return `
            <div class="login-container">
                <h1>👷 Jaiswal Workforce</h1>
                <p class="subtitle">Management System</p>
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="loginEmail" placeholder="your@email.com" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" class="form-control" id="loginPassword" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center;">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </form>
                <p style="margin-top:1rem; font-size:0.75rem; color:#6b7280; text-align:center;">
                    Use your Supabase Auth credentials
                </p>
            </div>
        `;
    }

    attachEvents(app) {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                await app.handleLogin(email, password);
            });
        }
    }
}

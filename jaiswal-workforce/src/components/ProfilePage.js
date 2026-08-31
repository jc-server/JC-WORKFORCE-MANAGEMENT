import { supabase } from '../config/supabase.js';
import { showToast } from '../utils/dom.js';

export class ProfilePage {
    render(user) {
        if (!user) return '';
        
        const email = user.email || '';
        const name = user.user_metadata?.name || '';
        const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '';
        
        return `
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title"><i class="fas fa-user-circle"></i> Profile</div>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="profile-grid">
                        <div class="profile-field">
                            <label>Name</label>
                            <div class="value">${this.escapeHtml(name) || 'Not set'}</div>
                        </div>
                        <div class="profile-field">
                            <label>Email</label>
                            <div class="value">${this.escapeHtml(email)}</div>
                        </div>
                        <div class="profile-field">
                            <label>Member Since</label>
                            <div class="value">${createdAt || 'N/A'}</div>
                        </div>
                        <div class="profile-field">
                            <label>User ID</label>
                            <div class="value" style="font-size:0.75rem; color:#6b7280;">${user.id}</div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
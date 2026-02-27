export type BaserootRole = 'consumer' | 'creator' | 'dao' | null;

const ROLE_KEY = 'baseroot_role';

export function getRole(): BaserootRole {
    if (typeof window === 'undefined') return null;
    const role = localStorage.getItem(ROLE_KEY) as BaserootRole;
    if (role === 'consumer' || role === 'creator' || role === 'dao') {
        return role;
    }
    return null;
}

export function setRole(role: BaserootRole) {
    if (typeof window === 'undefined') return;
    if (!role) {
        localStorage.removeItem(ROLE_KEY);
        return;
    }
    localStorage.setItem(ROLE_KEY, role);
}

export function clearRole() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ROLE_KEY);
}

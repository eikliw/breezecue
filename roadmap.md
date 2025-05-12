# Roadmap

## Milestones

### V1.0 - Initial Release (In Progress)

*   [x] User Authentication (Basic email/password)
*   [x] Region Selection for Weather Data
*   [x] Basic Ad Preview based on generic weather condition
*   [x] **Multi-Vertical Onboarding & Settings (Playbooks)**
    *   [x] Data seed for default playbooks (`scripts/playbooksSeed.json`)
    *   [x] Firestore structure defined (`playbooks_default`, `users/{uid}/playbooks`)
    *   [x] Onboarding flow: Add Business Type selection step.
    *   [x] Onboarding flow: Copy matching templates from `playbooks_default` to `users/{uid}/playbooks`.
    *   [x] Onboarding flow: Save `businessType` in `users/{uid}.businessType`.
    *   [x] Settings page: Create `/settings` page with NavBar link.
    *   [x] Settings page: Display current `businessType`.
    *   [x] Settings page: Allow changing `businessType` (with confirmation to replace playbooks).
    *   [x] Settings page: Display playbooks table (Name, Trigger, Edit, Delete).
*   [ ] Detailed Ad Customization Interface
*   [ ] Real-time Weather Triggering Logic
*   [ ] Ad Platform Integration (e.g., Google Ads API)

## Future Considerations

*   Advanced Analytics Dashboard
*   Team/Agency Features
*   A/B Testing for Ad Copy
*   Expanded list of Business Types and Playbook Templates
*   Integration with more Ad Platforms
*   AI-powered copy suggestions 
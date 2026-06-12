```javascript
const SETTINGS_KEY =
    'nexus_settings';

class SettingsManager {

    constructor() {

        this.settings =
            this.load();

        this.applyTheme();
    }

    load() {

        return JSON.parse(
            localStorage.getItem(
                SETTINGS_KEY
            )
        ) || {
            theme: 'dark',
            accent: '#3b82f6'
        };
    }

    save() {

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify(
                this.settings
            )
        );
    }

    setTheme(theme) {

        this.settings.theme =
            theme;

        this.save();

        this.applyTheme();
    }

    applyTheme() {

        document.body.setAttribute(
            'data-theme',
            this.settings.theme
        );
    }

    exportData() {

        const data = JSON.stringify(
            localStorage,
            null,
            2
        );

        const blob =
            new Blob(
                [data],
                {
                    type:
                    'application/json'
                }
            );

        const link =
            document.createElement('a');

        link.href =
            URL.createObjectURL(blob);

        link.download =
            'nexus-backup.json';

        link.click();
    }
}

const settingsManager =
    new SettingsManager();
```

```javascript
const PLANNER_KEY = 'nexus_planner';

class PlannerManager {

    constructor() {
        this.blocks = this.load();
    }

    load() {
        return JSON.parse(
            localStorage.getItem(PLANNER_KEY)
        ) || [];
    }

    save() {
        localStorage.setItem(
            PLANNER_KEY,
            JSON.stringify(this.blocks)
        );
    }

    addBlock(block) {
        this.blocks.push({
            id: Date.now(),
            ...block
        });

        this.save();
    }

    deleteBlock(id) {
        this.blocks =
            this.blocks.filter(
                b => b.id !== id
            );

        this.save();
    }
}

const plannerManager =
    new PlannerManager();
```

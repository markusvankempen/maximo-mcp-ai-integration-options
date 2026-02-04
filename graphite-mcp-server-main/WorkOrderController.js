/**
 * WorkOrderController
 * Handles business logic for the Work Order management page.
 */
export default class WorkOrderController {

    /**
     * pageInitialized lifecycle hook
     * Triggered once when the page and its datasources are ready.
     */
    pageInitialized(page, app) {
        console.error('[WorkOrderController] Page initialized');
        this.page = page;
        this.app = app;
    }

    /**
     * refreshData event handler
     * Bound to the Refresh button in the header.
     */
    refreshData() {
        const ds = this.page.findDatasource('woDS');
        if (ds) {
            ds.refresh();
        }
    }

    /**
     * saveWO event handler
     * Bound to the Save button in the detail view.
     */
    async saveWO() {
        const ds = this.page.findDatasource('woDS');
        if (ds && ds.isDirty()) {
            try {
                await ds.save();
                this.app.showToast({
                    message: `Work Order ${ds.selectedItem.wonum} saved successfully`,
                    type: 'success'
                });
            } catch (error) {
                this.app.showToast({
                    message: `Failed to save: ${error.message}`,
                    type: 'error'
                });
            }
        }
    }

    /**
     * createWO event handler
     * Adds a new record to the datasource.
     */
    createWO() {
        const ds = this.page.findDatasource('woDS');
        if (ds) {
            ds.addNewRecord();
        }
    }
}

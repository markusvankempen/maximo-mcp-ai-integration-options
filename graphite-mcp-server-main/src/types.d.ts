export type LIST_INDEX_OUTPUT_SCHEMA = {
    indices: Array<{
        index_name: string;
        description: string;
        domain: string;
    }>;
}
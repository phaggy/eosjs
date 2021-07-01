const tests = require('./node');

describe('Node JS environment', () => {
    let transactionResponse: any;
    let transactionSignatures: any;
    let failedAsPlanned: boolean;

    it('transacts with configuration object containing blocksBehind', async () => {
        transactionResponse = await tests.transactWithConfig({
            blocksBehind: 3,
            expireSeconds: 30
        }, 'transactWithBlocksBehind');
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    });

    it('transacts with configuration object containing useLastIrreversible', async () => {
        transactionResponse = await tests.transactWithConfig({
            useLastIrreversible: true,
            expireSeconds: 30
        }, 'transactWithUseLastIrreversible');
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    });

    it('transacts with manually configured TAPOS fields', async () => {
        transactionResponse = await tests.transactWithoutConfig();
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    }, 10000);

    it('transacts with compressed transaction', async () => {
        transactionResponse = await tests.transactWithConfig({
            blocksBehind: 3,
            expireSeconds: 30,
            compression: true
        }, 'transactWithCompression');
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    });

    it('transacts with context free action', async () => {
        transactionResponse = await tests.transactWithContextFreeAction();
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    });

    it('transacts with context free data', async () => {
        transactionResponse = await tests.transactWithContextFreeData();
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    });

    it('transacts without broadcasting, returning signatures and packed transaction', async () => {
        transactionSignatures = await tests.transactWithConfig({
            broadcast: false,
            blocksBehind: 3,
            expireSeconds: 30
        }, 'transactWithoutBroadcast');
        expect(Object.keys(transactionSignatures)).toContain('signatures');
        expect(Object.keys(transactionSignatures)).toContain('serializedTransaction');
    });

    it('broadcasts packed transaction, given valid signatures', async () => {
        transactionSignatures = await tests.transactWithConfig({
            broadcast: false,
            blocksBehind: 3,
            expireSeconds: 30
        }, 'transactWithoutBroadcast2');
        transactionResponse = await tests.broadcastResult(transactionSignatures);
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    });

    describe('Json Abi with Shorthand Design', () => {
        it('transacts with shorthand structure using api', async () => {
            transactionResponse = await tests.transactWithShorthandApiJson();
            expect(Object.keys(transactionResponse)).toContain('transaction_id');
        });

        it('transacts with shorthand structure using tx', async () => {
            transactionResponse = await tests.transactWithShorthandTxJson();
            expect(Object.keys(transactionResponse)).toContain('transaction_id');
        });

        it('transacts with shorthand structure using tx and context free action', async () => {
            transactionResponse = await tests.transactWithShorthandTxJsonContextFreeAction();
            expect(Object.keys(transactionResponse)).toContain('transaction_id');
        });

        it('transacts with shorthand structure using tx and context free data', async () => {
            transactionResponse = await tests.transactWithShorthandTxJsonContextFreeData();
            expect(Object.keys(transactionResponse)).toContain('transaction_id');
        });
    });

    it('transacts with elliptic p256/KeyType.R1 keys and signatures', async () => {
        transactionResponse = await tests.transactWithConfig({
            blocksBehind: 3,
            expireSeconds: 30
        }, 'transactWithR1KeySignature', 'bobr1', 'alicer1');
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    });

    it('confirms an action\'s return value can be verified', async () => {
        const expectedValue = 10;
        transactionResponse = await tests.transactWithReturnValue();
        expect(transactionResponse.processed.action_traces[0].return_value_data).toEqual(expectedValue);
    });

    it('transacts with resource payer', async () => {
        transactionResponse = await tests.transactWithResourcePayer();
        expect(Object.keys(transactionResponse)).toContain('transaction_id');
    });

    it('confirms the return value of the read-only query', async () => {
        const expectedValue = [
            {'age': 25, 'gender': 1, 'id': 1, 'name': 'Bob Smith'},
            {'age': 42, 'gender': 1, 'id': 3, 'name': 'John Smith'},
            {'age': 27, 'gender': 1, 'id': 4, 'name': 'Jack Smith'},
            {'age': 20, 'gender': 0, 'id': 2, 'name': 'Alice Smith'},
            {'age': 26, 'gender': 0, 'id': 5, 'name': 'Youko Niihara'},
            {'age': 18, 'gender': 0, 'id': 6, 'name': 'Rose Lee'},
            {'age': 25, 'gender': 0, 'id': 7, 'name': 'Youko Kawakami'},
            {'age': 24, 'gender': 0, 'id': 8, 'name': 'Yuu Yamada'}
        ];
        transactionResponse = await tests.readOnlyQuery();
        expect(transactionResponse.result.action_traces[0].return_value_data).toEqual(expectedValue);
    });

    it('returns failure trace for failed transaction', async () => {
        let err;
        try {
            await tests.readOnlyFailureTrace();
        } catch (e) {
            err = e.details;
        }
        expect(err.code).toEqual(3050003);
        expect(err.stack[0].data.s).toEqual('overdrawn balance');
    });

    it('throws appropriate error message without configuration object or TAPOS in place', async () => {
        try {
            failedAsPlanned = true;
            await tests.transactShouldFail();
            failedAsPlanned = false;
        } catch (e) {
            if (e.message !== 'Required configuration or TAPOS fields are not present') {
                failedAsPlanned = false;
            }
        }
        expect(failedAsPlanned).toEqual(true);
    });

    it('throws an an error with RpcError structure for invalid RPC calls', async () => {
        try {
            failedAsPlanned = true;
            await tests.rpcShouldFail();
            failedAsPlanned = false;
        } catch (e) {
            if (!e.json || !e.json.error || !(e.json.error.hasOwnProperty('details'))) {
                failedAsPlanned = false;
            }
        }
        expect(failedAsPlanned).toEqual(true);
    });
});

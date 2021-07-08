const expectFail = async (promise) => {
    try {
        await promise;
    } catch (error) {
        assert.exists(error)
        return;
    }
    assert.equal(true, false, 'This test should have failed');
}

module.exports = expectFail;
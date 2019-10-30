const test = require('tape');
delete require.cache[require.resolve('../index')]
const BZ2 = require('../index');

test('it waits for init before returning an instance', async function (t) {
	let init1 = BZ2.init();
	let init2 = BZ2.init();
	var done1 = false;
	init1.then(function () {
		done1 = true;
	});
	await init2;
	t.ok(done1);
	t.end();
});

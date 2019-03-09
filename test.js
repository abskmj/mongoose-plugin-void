const expect = require('chai').expect;

const Mongoose = require('mongoose').Mongoose;
const Mockgoose = require('mockgoose').Mockgoose;

const plugin = require('./index');

describe('Plugin', () => {
    let mockgoose, mongoose, User;

    before(async function() {
        // mockgoose will take some time to install a local mongodb
        this.timeout(0);

        // setup of mockgoose
        mongoose = new Mongoose();
        mockgoose = new Mockgoose(mongoose);

        await mockgoose.prepareStorage();
        await mongoose.connect('mongodb://test/test', { useNewUrlParser: true });

        mongoose.set('useFindAndModify', false);

        // setup test model
        let schema = new mongoose.Schema({
            name: String
        });

        schema.plugin(plugin);

        User = mongoose.model('User', schema);
    });

    after(async() => {
        await mockgoose.shutdown();
    });

    beforeEach(async() => {
        await mockgoose.helper.reset();

        // seed data
        await User.create([
            { name: 'ABC' },
            { name: 'ABC', void: true }
        ]);
    });

    describe('add query helper', () => {

        it('withVoids to include voided records', async() => {
            let query = User.find({ name: 'ABC' })
                .sort('name')
                .withVoids();

            expect(query.getQuery()).to.not.have.property('void');
            expect(query.getOptions()).to.have.property('includeVoid');
        });

        it('onlyVoids to return voided records only', async() => {
            let query = User.find({ name: 'ABC' })
                .sort('name')
                .onlyVoids();

            expect(query.getQuery()).to.have.property('void', true);
        });

    });

    describe('add option', () => {

        it('includeVoid to include voided records', async() => {
            let users = await User.find({ name: 'ABC' }, {}, { includeVoid: true }).sort('-void');

            // checking first document is sufficient as the list is sorted
            expect(users[0]).to.have.property('void', true);

        });

    });

    describe('modify existing model method to exclude voided records', () => {
        it('find', async() => {
            let users = await User.find({ name: 'ABC' })
                .sort('-void');

            // checking first document is sufficient as the list is sorted
            expect(users[0]).to.have.property('void', false);
        });

        it('count', async() => {
            let count = await User.countDocuments({ name: 'ABC' });
            expect(count).to.equal(1);
        });
    });

    describe('add model method to void a record', () => {

        it('findOneAndVoid', async() => {
            let user = await User.findOneAndVoid({ void: false }, { new: true });

            expect(user).to.have.property('void', true);
        });

        it('findByIdAndVoid', async() => {
            let user = await User.findOne({ void: false });
            let updateUser = await User.findByIdAndVoid(user, { new: true });

            expect(updateUser).to.have.property('void', true);
        });

    });
});

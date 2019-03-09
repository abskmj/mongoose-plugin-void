module.exports = (schema, options) => {
    
    // fields
    schema.add({
        void: {
            type: Boolean,
            default: false
        }
    });

    // query helpers
    schema.query.onlyVoids = function() {
        return this.where({ void: true });
    }

    schema.query.withVoids = function() {
        return this.setOptions({ includeVoid: true });
    }

    // common query middleware
    let middleware = function() {
        let query = this.getQuery();
        let options = this.getOptions();

        if (options.includeVoid) {
            // no changes to query
        }
        else if (query.void == undefined || query.void == null) {
            this.where({ void: false });
        }
    }

    // attach middleware
    schema.pre('count', middleware);
    schema.pre('countDocuments', middleware);
    schema.pre('find', middleware);
    schema.pre('findOne', middleware);

    // model methods
    schema.static('findOneAndVoid', function(conditions, options, callback) {
        return this.findOneAndUpdate.call(this, conditions, { void: true }, options, callback);
    });

    schema.static('findByIdAndVoid', function(id, options, callback) {
        return this.findOneAndVoid.call(this, { _id: id }, options, callback);
    });
};

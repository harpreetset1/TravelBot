var builder = require('botbuilder');
var Store = require('./store');

module.exports = [
    // Destination
    function (session) {
        session.send('Welcome to the Flights finder!');
        builder.Prompts.text(session, 'Please enter your origin');
    },
    function (session, results, next) {
        session.dialogData.origin = results.response;
        builder.Prompts.text(session, 'Please enter your destination');
        next();
    },
    function (session, results, next) {
        session.dialogData.destination = results.response;
        session.send('Looking for hotels in %s', results.response);
        next();
    },
    // Check-in
    function (session) {
        builder.Prompts.time(session, 'When do you want to fly?');
    },
    function (session, results, next) {
        session.dialogData.checkIn = results.response.resolution.start;
        next();
    },

    // Nights
    function (session) {
        builder.Prompts.number(session, 'When do you want to return?');
    },
    function (session, results, next) {
        session.dialogData.nights = results.response;
        next();
    },

    // Search...
    function (session) {
        var origin = session.dialogData.origin;
        var destination = session.dialogData.destination;
        var checkIn = new Date(session.dialogData.checkIn);
        var checkOut = checkIn.addDays(session.dialogData.nights);

        session.send(
            'Ok. Searching for Flights from %s to %s date from %d/%d to %d/%d...',
            origin,destination,
            checkIn.getMonth() + 1, checkIn.getDate(),
            checkOut.getMonth() + 1, checkOut.getDate());

        // Async search
        Store
            .searchFlights(origin, destination, checkIn, checkOut)
            .then(function (flights) {
                // Results
                session.send('I found in total %d flights for your dates:', flights.length);

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(flights.map(flightAsAttachment));

                session.send(message);

                // End
                session.endDialog();
            });
    }
];

// Helpers
function flightAsAttachment(flight) {
    return new builder.HeroCard()
        .title(flight.name)
        .subtitle('%d stars. %d reviews. From $%d per passenger.', flight.rating, flight.numberOfReviews, flight.priceStarting)
        .images([new builder.CardImage().url(flight.image)])
        .buttons([
            new builder.CardAction()
                .title('More details')
                .type('openUrl')
                .value('https://www.bing.com/search?q=flights +to+' + encodeURIComponent(flight.location))
        ]);
}

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};
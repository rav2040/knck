const EXAMPLE_URL = 'https://www.example.com/';
const { baseUrl } = Cypress.config();

it('Shortening a URL works as expected', () => {
  cy.visit('/');

  cy.get('#url')
    .type(EXAMPLE_URL)
    .should('have.value', EXAMPLE_URL);

  cy.get('.btn')
    .contains('Shorten')
    .click();

  cy.get('#short-url')
    .then($h4 => {
      const shortUrl = 'http://' + $h4.text().trim();

      cy.get('#copy-btn')
        .contains('Copy')
        .click();

      cy.wait(100);

      cy.get('#copy-btn')
        .contains('Copied');

      cy.task('getClipboard')
        .should(text => {
          expect(text).to.equal(shortUrl);
        });

      cy.get('#home-link')
        .contains('"Knck" Another URL')
        .click();

      cy.url()
        .should('eq', baseUrl + '/');

      cy.request({
        url: shortUrl,
        followRedirect: false,
      })
        .should(res => {
          expect(res.status).to.equal(302);
          expect(res.redirectedToUrl).to.equal(EXAMPLE_URL);
        });
    });
});

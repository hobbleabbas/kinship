# Kinship Canada

Charity powered by good software.

## To implement before prod
- [ ] Dashboard
- [ ] Admin system
    - [ ] Is admin ctx
- [ ] Donation system
    - [ ] Stripe
        - [x] Define type guards
        - [ ] Receipt revokation (payment disputed, donation refunded)
        - [ ] Metadata update system
    - [ ] Paypal
    - [ ] Recurring donations
    - [ ] Idempotency key system (mongo)
    - [ ] Donation collection page
        - [ ] Collect basic donations
        - [ ] Custom cause support 
- [ ] Notification system
- [ ] Proof system
- [ ] Misc
    - [ ] Better region, currency typing
    - [ ] Dynamic address validation - allow non North American addresses ot donate
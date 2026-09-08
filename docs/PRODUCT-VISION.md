# MHP Hypnose — Long-Term Product Vision

This is context, **not current MVP scope**.

Long term, MHP Hypnose should become the central digital system for the complete student journey:

Website → course selection → registration → payment → attendance → completion → evaluation → module diploma → further modules → qualification progress → exams → final diploma.

There should be one central student record reused throughout the lifecycle.

## User types
- Students
- Instructors
- School administrators

## Long-term capabilities
- student accounts and complete training history
- course/module/package entitlements
- distinction between entitlement and booking a specific date
- student dashboard with progress and diplomas
- instructor course/participant/attendance/completion view
- central admin student record
- evaluations + reminders
- configurable diploma eligibility
- diploma templates/generation/archive/verification
- qualification requirements/progress
- theoretical/practical exam eligibility, registration and results
- final diploma eligibility/generation
- status-driven communications
- course capacity/marketing alerts
- cancellations/rescheduling/refunds/credits
- waitlists/vouchers/manual payments/invoices
- audit trail, roles and permissions
- Swiss privacy/data-protection needs
- reporting/export/accounting integrations
- CRM/lead funnel

## Architectural implication
The MVP should keep durable concepts clean: `Course`, `CourseDate`, `Booking/Registration`, `Payment`. They should evolve into the richer student/training domain without rewriting historic booking/payment data.

## Product Review:
> Historical course-MVP review. These notes drove the implemented catalogue,
> dates, booking and SEO work and are not the forward roadmap. Current product
> sources of truth are [`MVP.md`](./MVP.md),
> [`PRODUCT-VISION.md`](./PRODUCT-VISION.md) and
> [`ROOM-BOOKING.md`](./ROOM-BOOKING.md).

* hide the language picker but don't remove the ability from the website. we might enable it again later. keep French only for now
* get the picture of the statue from this page https://www.mhp-hypnose.com/ and use it in the landing banner in the first page. don't make it too big just a nice touch. you don't need to match the styling of mhp-coaching. also very important remember the SEO instructions with the alt link and all the image stuff
* Reserve une place should be more like a shortcut to book courses quickly. basically if someone just knows what course they want this should save them clicks, but shouldn't assume which course they are looking for. act as a UI/UX designer and make it intuitive. avoid long drop downs, maybe make a calendar view instead to select the course there
* in vois les Formation, we should have search and filters. keep it simple and intuitive filter by date or course. and there should be a button to switch to Calendar view where we view all those courses overlayed on a calendar so help the user pick by dates. the default should be the current view always but this is just something they can switch to
* hide the Atelier Pratique. we want to pause those courses for now. remember that those courses will later be dynamic and get retrieved from the database and there will be in future iteration an admin panel to manage them, so keep the code structure appropriate for that
* in the inscription page we need to add to the information we are gathering the address of the students. also this information shoudl be saved in the database even if they didn't complete the payment (so we can use it for analytics later), but obviously it should be saved under a different status
* all the courses we currently have don't have any dates. we should fix this. the dates are here you can scrape this old website we have to get them https://www.mhp-hypnose.com/agenda. it is important to have the exact date of each course. also some of courses might have multiple available dates so then they should choose one of them in the inscription page. it is importnat that the date is clear and obvious and the user can choose it quickly and early in the process. there should be no guessing here to avoid that users drop out of the process because of date ambiguity.
* if the payment failed for any reason, or if they don't want to pay online, I want to give them the ability to contact us by email (form with resend) so we can find another solution for the payment for them
* also please hide the course Hypnose Transgénérationnelle — Méthode M.I.A.® . don't delete just hide it.

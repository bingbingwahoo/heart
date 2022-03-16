Simple heart rate monitor web application using the [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API).
This API is not supported on Firefox. This application has no external dependencies and records no analytics.

## Web App
The app can be tested at [https://bingbingwahoo.github.io/heart/](https://bingbingwahoo.github.io/heart/).

## Running Locally
1. Download and install [Node.js](https://nodejs.org/)
2. Run `start.bat`
3. Open [http://localhost:8080/](http://localhost:8080/)

## Configurable Appearance
Custom styles can be applied to the page by modifying the URL fragment and refreshing the page. The URL format is:
```
https://bingbingwahoo.github.io/heart/#!css=STYLESHEET
```
where `STYLESHEET` is the contents of a CSS style sheet.

This allows the appearance of the webpage to be configured without having to modify its contents.

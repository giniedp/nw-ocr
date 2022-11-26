This project is currently not in active development

# NW OCR
New World Screenshot reader for extracting world map status. Extracts following data

- Territory war and invasion status
- Territory government / control status
- Town upgrades and taxes status

# Development

1. install `tesseract` utility. Must be available in Path: https://github.com/tesseract-ocr/tessdoc/blob/main/Installation.md
2. run `yarn insstall`
3. create `tmp` dir in project root

## Commands
- `yarn run:en` will process all EN screenshots from sample directory and write output to `tmp` path
- `yarn run:de` will process all DE screenshots from sample directory and write output to `tmp` path
- `yarn test` will process all sample screenshots and compare against expected output. Tests do currently fails as it is still work in progress.

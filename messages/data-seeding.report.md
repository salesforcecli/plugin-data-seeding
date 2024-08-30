# summary

View the status of a data seeding job

# description

View the status of a data seeding job that has already been initiated or completed 

# examples

- Display the status of a specific data seeding job
  <%= config.bin %> <%= command.id %> --job-id="[XXXX-YYYY-ZZZZ-AAAA]"

- Display the status of a the most recent data seeding job
  <%= config.bin %> <%= command.id %> --use-most-recent
# flags.job-id.summary

ID of a specific data seeding job.

# flags.use-most-recent.summary

View status of most recent data seeding job.

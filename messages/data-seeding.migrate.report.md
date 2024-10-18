# summary

Display the status of a data-seeding migrate job.

# description

This command displays the status of a previously initiated or completed execution of the "data-seeding migrate" command. Run this command by either passing it the job ID returned by "data-seeding migrate", or use the --use-most-recent flag to view the status of the most recently run "data-seeding migrate" command.

# examples

- Display the status of a specific execution of the "data-seeding migrate" command:

  <%= config.bin %> <%= command.id %> --job-id 1234-5678-AAAA-BBBB

- Display the status of the most recently run "data-seeding migrate" command:

  <%= config.bin %> <%= command.id %> --use-most-recent
  
# flags.job-id.summary

ID of a specific execution of the "data-seeding migrate" command.
  
# flags.use-most-recent.summary

View the status of the most recently run "data-seeding migrate" command.

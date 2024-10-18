# summary

Migrate data from one org to another.

# description

This command migrates selected data from a source org and loads it into a target org. The command uses a JSON configuration file that defines the characteristics of the data. For example, the configuration file might specify a number of records from one or more Salesforce objects to migrate, along with the subset of fields to include. You must be authenticated to both the source and target orgs before running this command.

By default, this command runs synchronously and outputs a job ID along with a running status of each execution phase, such as querying the source org or loading into the target. If you prefer, you can run the command asynchronously by specifying the --async flag so that the control of the terminal is immediately returned to you. Then use the job ID to run the "data-seeding migrate report" command to view the status.

# examples

- Migrate data from the org with alias "mySourceOrg" to the org with alias "myTargetOrg"; use the specified configuration file to determine the data to migrate:

  <%= config.bin %> <%= command.id %> --source-org mySourceOrg --target-org myTargetOrg --config-file ./config/data-seed.json

- Migrate data by specifying usernames for the source and target orgs, and run the command asynchronously:

  <%= config.bin %> <%= command.id %> --source-org source@org.com --target-org target@org.com --config-file=./config/data-seed.json --async

- Migrate data using org aliases; if after 5 minutes the command hasn't finished, it completes asynchronously:

  <%= config.bin %> <%= command.id %> --source-org mySourceOrg --target-org myTargetOrg --config-file ./config/data-seed.json --wait 5

# flags.target-org.summary

Username or alias of the target org into which the migrated data is loaded.

# flags.source-org.summary

Username or alias of the source org that contains the data to be migrated.

# flags.config-file.summary

Path to the data migration JSON configuration file.

# flags.async.summary

Run the command asynchronously and immediately return control of the terminal.

# flags.wait.summary

Number of minutes to wait for the command to complete; when reached, the command completes asynchronously if necessary.

# report.suggestion

- Run this command to check the status of the data migration: "sf data-seeding migrate report --job-id %s"

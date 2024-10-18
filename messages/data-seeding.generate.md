# summary

Generate synthetic org data that mimics existing data in a source org, and then load it into a separate target org.

# description

This command uses AI to generate synthetic (or "fake") data that has a similar format to selected data in a source org. The command uses a JSON configuration file to define the characteristics of the synthetic data. For example, the configuration file might specify the number of records to generate for one or more Salesforce objects, along with the subset of fields to include. Once generated, the data is automatically loaded into the specified target org. You must be authenticated to both the source and target orgs before running this command.

By default, this command runs synchronously and outputs the job ID, along with a running status of each execution phase, such as querying the source org or generating the data. If you prefer, you can run the command asynchronously by specifying the --async flag so that the control of the terminal is immediately returned to you. Then use the job ID to run the "data-seeding generate report" command to view the status.

# examples

- Generate synthetic data similar to existing data in the org with alias "mySourceOrg" then load it into the org with alias "myTargetOrg"; use the specified config file to determine the format of the generated data:

  <%= config.bin %> <%= command.id %> --source-org mySourceOrg --target-org myTargetOrg --config-file ./config/seed-config.json

- Generate synthetic data using org usernames and run the command asynchronously:

  <%= config.bin %> <%= command.id %> --source-org source@org.com" --target-org target@org.com" --config-file ./config/seed-config.json --async

- Generate synthetic data using org aliases; if after 5 minutes the command hasn't finished, it completes asynchronously:

  <%= config.bin %> <%= command.id %> --source-org source@org.com" --target-org target@org.com" --config-file ./config/seed-config.json --wait 5

# flags.target-org.summary

Username or alias of the target org into which the generated data will be loaded.

# flags.source-org.summary

Username or alias of the source org that contains the data that AI will mimic.

# flags.config-file.summary

Path to the data seeding JSON configuration file.

# flags.wait.summary

Number of minutes to wait for the command to complete; when reached, the command completes asynchronously if necessary.

# flags.async.summary

Run the command asynchronously and immediately return control of the terminal.

# report.suggestion

- Run this command to check the status of the data generation: "sf data-seeding generate report --job-id %s"

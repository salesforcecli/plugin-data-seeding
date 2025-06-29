**NOTE: This template for sf plugins is not yet official. Please consult with the Platform CLI team before using this template.**

# plugin-data-seeding

[![NPM](https://img.shields.io/npm/v/@salesforce/plugin-data-seeding.svg?label=@salesforce/plugin-data-seeding)](https://www.npmjs.com/package/@salesforce/plugin-data-seeding) [![Downloads/week](https://img.shields.io/npm/dw/@salesforce/plugin-data-seeding.svg)](https://npmjs.org/package/@salesforce/plugin-data-seeding) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/plugin-data-seeding/main/LICENSE.txt)

## Using the template

This repository provides a template for creating a plugin for the Salesforce CLI. To convert this template to a working plugin:

1. Please get in touch with the Platform CLI team. We want to help you develop your plugin.
2. Generate your plugin:

   ```
   sf plugins install dev
   sf dev generate plugin

   git init -b main
   git add . && git commit -m "chore: initial commit"
   ```

3. Create your plugin's repo in the salesforcecli github org
4. When you're ready, replace the contents of this README with the information you want.

## Learn about `sf` plugins

Salesforce CLI plugins are based on the [oclif plugin framework](https://oclif.io/docs/introduction). Read the [plugin developer guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_plugins.meta/sfdx_cli_plugins/cli_plugins_architecture_sf_cli.htm) to learn about Salesforce CLI plugin development.

This repository contains a lot of additional scripts and tools to help with general Salesforce node development and enforce coding standards. You should familiarize yourself with some of the [node developer packages](#tooling) used by Salesforce. There is also a default circleci config using the [release management orb](https://github.com/forcedotcom/npm-release-management-orb) standards.

Additionally, there are some additional tests that the Salesforce CLI will enforce if this plugin is ever bundled with the CLI. These test are included by default under the `posttest` script and it is required to keep these tests active in your plugin if you plan to have it bundled.

### Tooling

- [@salesforce/core](https://github.com/forcedotcom/sfdx-core)
- [@salesforce/kit](https://github.com/forcedotcom/kit)
- [@salesforce/sf-plugins-core](https://github.com/salesforcecli/sf-plugins-core)
- [@salesforce/ts-types](https://github.com/forcedotcom/ts-types)
- [@salesforce/ts-sinon](https://github.com/forcedotcom/ts-sinon)
- [@salesforce/dev-config](https://github.com/forcedotcom/dev-config)
- [@salesforce/dev-scripts](https://github.com/forcedotcom/dev-scripts)

# Everything past here is only a suggestion as to what should be in your specific plugin's description

This plugin is bundled with the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). For more information on the CLI, read the [getting started guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm).

We always recommend using the latest version of these commands bundled with the CLI, however, you can install a specific version or tag if needed.

## Install

```bash
sf plugins install @salesforce/plugin-data-seeding@x.y.z
```

## Issues

Please report any issues at https://github.com/forcedotcom/cli/issues

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Sign CLA (see [CLA](#cla) below).
9. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:salesforcecli/plugin-data-seeding

# Install the dependencies and compile
yarn && yarn build
```

To use your plugin, run using the local `./bin/dev.js` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev.js data-seeding generate
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sf cli
sf plugins link .
# To verify
sf plugins
```

## Commands

<!-- commands -->

- [`sf data-seeding generate`](#sf-data-seeding-generate)
- [`sf data-seeding generate report`](#sf-data-seeding-generate-report)
- [`sf data-seeding migrate`](#sf-data-seeding-migrate)
- [`sf data-seeding migrate report`](#sf-data-seeding-migrate-report)

## `sf data-seeding generate`

Generate synthetic org data that mimics existing data in a source org, and then load it into a separate target org.

```
USAGE
  $ sf data-seeding generate -o <value> -s <value> -f <value> [--json] [--flags-dir <value>] [-w <value> | --async]

FLAGS
  -f, --config-file=<value>  (required) Path to the data seeding JSON configuration file.
  -o, --target-org=<value>   (required) Username or alias of the target org into which the generated data will be
                             loaded.
  -s, --source-org=<value>   (required) Username or alias of the source org that contains the data that AI will mimic.
  -w, --wait=<value>         [default: 33 minutes] Number of minutes to wait for the command to complete; when reached,
                             the command completes asynchronously if necessary.
      --async                Run the command asynchronously and immediately return control of the terminal.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Generate synthetic org data that mimics existing data in a source org, and then load it into a separate target org.

  This command uses AI to generate synthetic (or "fake") data that has a similar format to selected data in a source
  org. The command uses a JSON configuration file to define the characteristics of the synthetic data. For example, the
  configuration file might specify the number of records to generate for one or more Salesforce objects, along with the
  subset of fields to include. Once generated, the data is automatically loaded into the specified target org. You must
  be authenticated to both the source and target orgs before running this command.

  By default, this command runs synchronously and outputs the job ID, along with a running status of each execution
  phase, such as querying the source org or generating the data. If you prefer, you can run the command asynchronously
  by specifying the --async flag so that the control of the terminal is immediately returned to you. Then use the job ID
  to run the "data-seeding generate report" command to view the status.

EXAMPLES
  Generate synthetic data similar to existing data in the org with alias "mySourceOrg" then load it into the org with
  alias "myTargetOrg"; use the specified config file to determine the format of the generated data:

    $ sf data-seeding generate --source-org mySourceOrg --target-org myTargetOrg --config-file \
      ./config/seed-config.json

  Generate synthetic data using org usernames and run the command asynchronously:

    $ sf data-seeding generate --source-org source@org.com" --target-org target@org.com" --config-file \
      ./config/seed-config.json --async

  Generate synthetic data using org aliases; if after 5 minutes the command hasn't finished, it completes
  asynchronously:

    $ sf data-seeding generate --source-org source@org.com" --target-org target@org.com" --config-file \
      ./config/seed-config.json --wait 5
```

_See code: [src/commands/data-seeding/generate/index.ts](https://github.com/salesforcecli/plugin-data-seeding/blob/1.1.42/src/commands/data-seeding/generate/index.ts)_

## `sf data-seeding generate report`

Display the status of a data-seeding generate job.

```
USAGE
  $ sf data-seeding generate report [--json] [--flags-dir <value>] [-i <value>] [-r]

FLAGS
  -i, --job-id=<value>   ID of a specific execution of the "data-seeding generate" command.
  -r, --use-most-recent  View the status of the most recently run "data-seeding generate" command.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Display the status of a data-seeding generate job.

  This command displays the status of a previously initiated or completed execution of the "data-seeding generate"
  command. Run this command by either passing it the job ID returned by "data-seeding generate", or use the
  --use-most-recent flag to view the status of the most recently run "data-seeding generate" command.

EXAMPLES
  Display the status of a specific execution of the "data-seeding generate" command:

    $ sf data-seeding generate report --job-id 1234-5678-AAAA-BBBB

  Display the status of the most recently run "data-seeding generate" command:

    $ sf data-seeding generate report --use-most-recent
```

_See code: [src/commands/data-seeding/generate/report.ts](https://github.com/salesforcecli/plugin-data-seeding/blob/1.1.42/src/commands/data-seeding/generate/report.ts)_

## `sf data-seeding migrate`

Migrate data from one org to another.

```
USAGE
  $ sf data-seeding migrate -o <value> -s <value> -f <value> [--json] [--flags-dir <value>] [-w <value> | --async]

FLAGS
  -f, --config-file=<value>  (required) Path to the data migration JSON configuration file.
  -o, --target-org=<value>   (required) Username or alias of the target org into which the migrated data is loaded.
  -s, --source-org=<value>   (required) Username or alias of the source org that contains the data to be migrated.
  -w, --wait=<value>         [default: 33 minutes] Number of minutes to wait for the command to complete; when reached,
                             the command completes asynchronously if necessary.
      --async                Run the command asynchronously and immediately return control of the terminal.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Migrate data from one org to another.

  This command migrates selected data from a source org and loads it into a target org. The command uses a JSON
  configuration file that defines the characteristics of the data. For example, the configuration file might specify a
  number of records from one or more Salesforce objects to migrate, along with the subset of fields to include. You must
  be authenticated to both the source and target orgs before running this command.

  By default, this command runs synchronously and outputs a job ID along with a running status of each execution phase,
  such as querying the source org or loading into the target. If you prefer, you can run the command asynchronously by
  specifying the --async flag so that the control of the terminal is immediately returned to you. Then use the job ID to
  run the "data-seeding migrate report" command to view the status.

EXAMPLES
  Migrate data from the org with alias "mySourceOrg" to the org with alias "myTargetOrg"; use the specified
  configuration file to determine the data to migrate:

    $ sf data-seeding migrate --source-org mySourceOrg --target-org myTargetOrg --config-file \
      ./config/data-seed.json

  Migrate data by specifying usernames for the source and target orgs, and run the command asynchronously:

    $ sf data-seeding migrate --source-org source@org.com --target-org target@org.com \
      --config-file=./config/data-seed.json --async

  Migrate data using org aliases; if after 5 minutes the command hasn't finished, it completes asynchronously:

    $ sf data-seeding migrate --source-org mySourceOrg --target-org myTargetOrg --config-file \
      ./config/data-seed.json --wait 5
```

_See code: [src/commands/data-seeding/migrate/index.ts](https://github.com/salesforcecli/plugin-data-seeding/blob/1.1.42/src/commands/data-seeding/migrate/index.ts)_

## `sf data-seeding migrate report`

Display the status of a data-seeding migrate job.

```
USAGE
  $ sf data-seeding migrate report [--json] [--flags-dir <value>] [-i <value>] [-r]

FLAGS
  -i, --job-id=<value>   ID of a specific execution of the "data-seeding migrate" command.
  -r, --use-most-recent  View the status of the most recently run "data-seeding migrate" command.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Display the status of a data-seeding migrate job.

  This command displays the status of a previously initiated or completed execution of the "data-seeding migrate"
  command. Run this command by either passing it the job ID returned by "data-seeding migrate", or use the
  --use-most-recent flag to view the status of the most recently run "data-seeding migrate" command.

EXAMPLES
  Display the status of a specific execution of the "data-seeding migrate" command:

    $ sf data-seeding migrate report --job-id 1234-5678-AAAA-BBBB

  Display the status of the most recently run "data-seeding migrate" command:

    $ sf data-seeding migrate report --use-most-recent
```

_See code: [src/commands/data-seeding/migrate/report.ts](https://github.com/salesforcecli/plugin-data-seeding/blob/1.1.42/src/commands/data-seeding/migrate/report.ts)_

<!-- commandsstop -->

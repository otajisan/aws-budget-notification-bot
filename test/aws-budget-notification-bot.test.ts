import * as cdk from 'aws-cdk-lib';
import {Template} from 'aws-cdk-lib/assertions';
import {AwsBudgetNotificationBotStack} from "../lib/aws-budget-notification-bot-stack";

describe('correct resources are created', () => {
  const synthStack = () => {
    const app = new cdk.App();
    const env = {
      account: process.env.CDK_DEPLOY_ACCOUNT,
      region: process.env.CDK_DEPLOY_REGION,
    };
    return new AwsBudgetNotificationBotStack(app, 'AwsBudgetNotificationBotStack', {
      env,
    });
  };

  test('Slack channel configuration is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'morningcode-budget-alert';
    template.hasResourceProperties('AWS::Chatbot::SlackChannelConfiguration', {
      ConfigurationName: expected,
    });
  });

  test('SNS topic is created', () => {
    const template = Template.fromStack(synthStack());

    const expected = 'morningcode-budgets-alert';
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: expected,
    });
  });

  test('Budgets are created', () => {
    const template = Template.fromStack(synthStack());

    const expected = ['morningcode-billing-cost-daily', 'morningcode-billing-cost-monthly'];

    expected.forEach(budgetName =>
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {BudgetName: budgetName},
      }));
  });

});

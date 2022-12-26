import {Stack, StackProps, Tags} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {CfnBudget} from 'aws-cdk-lib/aws-budgets';
import {Topic} from 'aws-cdk-lib/aws-sns';
import {Effect, PolicyStatement, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import {SlackChannelConfiguration} from "aws-cdk-lib/aws-chatbot";
import {StringParameter} from "aws-cdk-lib/aws-ssm";

export class AwsBudgetNotificationBotStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Chatbot
    // https://docs.aws.amazon.com/cdk/api/v1/docs/aws-chatbot-readme.html
    const slackChannel = new SlackChannelConfiguration(this, 'AlertSlackChannel', {
      slackChannelConfigurationName: 'morningcode-budget-alert',
      slackWorkspaceId: StringParameter.valueFromLookup(this, 'MORNINGCODE_SLACK_WORKSPACE_ID'),
      slackChannelId: StringParameter.valueFromLookup(this, 'MORNINGCODE_SLACK_CHANNEL_ID_INTEGRATION'),
    });

    slackChannel.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cloudwatch:Describe*',
        'cloudwatch:Get*',
        'cloudwatch:List*',
      ],
      resources: ['*'],
    }));

    const topic = new Topic(this, 'BudgetsAlertTopic', {
      topicName: 'morningcode-budgets-alert',
      displayName: 'morningcode budgets alert',
    });
    topic.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['SNS:Publish'],
        principals: [new ServicePrincipal('budgets.amazonaws.com')],
        resources: [topic.topicArn],
      }),
    );

    const {topicArn} = topic;

    // Budgets
    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_budgets-readme.html
    new CfnBudget(this, 'Budget', {
      budget: {
        budgetName: 'morningcode-billing-cost-daily',
        budgetType: 'COST',
        timeUnit: 'DAILY',
        budgetLimit: {
          amount: 10.0,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80.0,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{
            subscriptionType: 'SNS',
            address: topicArn,
          }],
        },
      ],
    });

    new CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: 'morningcode-billing-cost-monthly',
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: 50.0,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        // Minor threshold
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 30.0,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{
            subscriptionType: 'SNS',
            address: topicArn,
          }],
        },
        {
          notification: {
            notificationType: 'FORECASTED',
            comparisonOperator: 'GREATER_THAN',
            threshold: 30.0,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{
            subscriptionType: 'SNS',
            address: topicArn,
          }],
        },
        // Medium threshold
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 50.0,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{
            subscriptionType: 'SNS',
            address: topicArn,
          }],
        },
        {
          notification: {
            notificationType: 'FORECASTED',
            comparisonOperator: 'GREATER_THAN',
            threshold: 50.0,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{
            subscriptionType: 'SNS',
            address: topicArn,
          }],
        },
        // High threshold
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80.0,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{
            subscriptionType: 'SNS',
            address: topicArn,
          }],
        },
        {
          notification: {
            notificationType: 'FORECASTED',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80.0,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [{
            subscriptionType: 'SNS',
            address: topicArn,
          }],
        },
      ],
    });

    slackChannel.addNotificationTopic(topic);

    Tags.of(this).add('ServiceName', 'morningcode');
  }
}
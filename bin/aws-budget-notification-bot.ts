#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {AwsBudgetNotificationBotStack} from '../lib/aws-budget-notification-bot-stack';

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION,
};

const app = new cdk.App();
new AwsBudgetNotificationBotStack(app, 'AwsBudgetNotificationBotStack', {env});

app.synth();
import { Stack, StackProps, aws_s3_assets, aws_elasticbeanstalk, aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CdkInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const asset = new aws_s3_assets.Asset(this, "Asset", {
      path: `${__dirname}/../../dist`
    });

    const applicationName = "WTSPublicGateway";

    const application = new aws_elasticbeanstalk.CfnApplication(
      this,
      "Application",
      { applicationName: applicationName }
    );

    const applicationVersion = new aws_elasticbeanstalk.CfnApplicationVersion(
      this,
      "ApplicationVersion",
      {
        applicationName: applicationName,
        sourceBundle: {
          s3Bucket: asset.s3BucketName,
          s3Key: asset.s3ObjectKey,
        },
      }
    );

    applicationVersion.addDependsOn(application)

    const role = new aws_iam.Role(
      this,
      `${applicationName}-aws-elasticbeanstalk-ec2-role`,
      { assumedBy: new aws_iam.ServicePrincipal("ec2.amazonaws.com") }
    );
    role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AWSElasticBeanstalkWebTier"
      )
    );

    const instanceProfile = new aws_iam.CfnInstanceProfile(
      this,
      `${applicationName}-InstanceProfile`,
      {
        instanceProfileName: `${applicationName}-InstanceProfile`,
        roles: [role.roleName]
      }
    )

    const elbEnv = new aws_elasticbeanstalk.CfnEnvironment(
      this,
      "Environment",
      {
        environmentName: "WTSPublicGatewayEnvironment",
        applicationName: applicationName,
        solutionStackName: "64bit Amazon Linux 2 v5.4.4 running Node.js 14",
        optionSettings: [
          {
            namespace: "aws:autoscaling:launchconfiguration",
            optionName: "IamInstanceProfile",
            value: instanceProfile.instanceProfileName,
          },
          {
            namespace: "aws:autoscaling:asg",
            optionName: "MinSize",
            value: "1",
          },
          {
            namespace: "aws:autoscaling:asg",
            optionName: "MaxSize",
            value: "1",
          },
          {
            namespace: "aws:ec2:instances",
            optionName: "InstanceTypes",
            value: "t2.micro",
          }
        ],
        versionLabel: applicationVersion.ref,
      }
    );
  }
}

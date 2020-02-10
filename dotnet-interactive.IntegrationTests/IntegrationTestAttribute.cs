﻿using System;
using Xunit;

namespace Microsoft.DotNet.Interactive.App.IntegrationTests
{
    /// <summary>
    /// Signifies that a unit test should only be run during the integration test leg and not as part of a normal test
    /// run or during the regular dev loop.
    /// 
    /// To run locally, [<see cref="IntegrationTestAttribute"/>] will need to be replaced with [<see cref="FactAttribute"/>].
    /// </summary>
    public class IntegrationTestAttribute : FactAttribute
    {
        public IntegrationTestAttribute()
        {
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("INTEGRATION_TEST_RUN")))
            {
                Skip = "Only run as an integration test";
            }
        }
    }
}

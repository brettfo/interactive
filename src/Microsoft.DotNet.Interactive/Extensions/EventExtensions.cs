﻿// Copyright (c) .NET Foundation and contributors. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis.Text;
using Microsoft.DotNet.Interactive.Commands;
using Microsoft.DotNet.Interactive.Events;

namespace Microsoft.DotNet.Interactive.Extensions
{
    internal static class EventExtensions
    {
        public static LinePositionSpan? CalculateLineOffsetFromParentCommand(this KernelEvent @event, LinePositionSpan? initialRange)
        {
            if (!initialRange.HasValue)
            {
                return null;
            }

            var range = initialRange.GetValueOrDefault();
            var requestCommand = @event.Command as LanguageServiceCommand;
            if (requestCommand?.Parent is LanguageServiceCommand parentRequest)
            {
                var requestPosition = requestCommand.LinePosition;
                var lineOffset = parentRequest.LinePosition.Line - requestPosition.Line;
                return new LinePositionSpan(
                    new LinePosition(range.Start.Line + lineOffset, range.Start.Character),
                    new LinePosition(range.End.Line + lineOffset, range.End.Character));
            }

            return range;
        }

        public static IReadOnlyCollection<Diagnostic> RemapDiagnosticsFromRequestingCommand(this KernelEvent @event, IReadOnlyCollection<Diagnostic> diagnostics)
        {
            if (@event.Command is SplittableCommand splittableCommand && splittableCommand.LanguageNode is { })
            {
                var root = splittableCommand.LanguageNode.SyntaxTree.GetRoot();
                var initialSpan = splittableCommand.LanguageNode.Span;
                var sourceText = SourceText.From(root.Text);
                var codePosition = sourceText.Lines.GetLinePositionSpan(initialSpan);
                return diagnostics.Select(d => d.WithLinePositionSpan(
                    new LinePositionSpan(
                        new LinePosition(d.LinePositionSpan.Start.Line + codePosition.Start.Line, d.LinePositionSpan.Start.Character),
                        new LinePosition(d.LinePositionSpan.End.Line + codePosition.Start.Line, d.LinePositionSpan.End.Character))
                    )
                ).ToImmutableList();
            }

            // no meaningful remapping can occur
            return diagnostics;
        }
    }
}

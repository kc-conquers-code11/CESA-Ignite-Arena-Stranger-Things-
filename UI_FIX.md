This task list tracks the implementation of the adaptive sidebar behavior and the new "Pin Timeline" functionality within the CompetitionLayout and CodingRound components.
1. State & Layout Foundations

    [ ] Define UI State: Add timelineOpen (hover) and isPinned (persistent) states in CompetitionLayout.tsx.

    [ ] Computed Visibility: Create a derived boolean isExpanded = timelineOpen || isPinned to drive layout logic.

    [ ] Dynamic Grid System: * [ ] Implement the 3-tier grid transition logic: * Default: 280px * Coding (Collapsed): 60px * Coding (Expanded): 340px

        [ ] Apply transition-all duration-500 ease-in-out to the main grid wrapper.

2. Timeline Component Enhancements

    [ ] Hover Wiring: Attach onMouseEnter and onMouseLeave handlers to the Timeline rail wrapper.

    [ ] Pin Feature:

        [ ] Add a PinIcon button to the top-right of the Timeline panel.

        [ ] Implement the setIsPinned toggle logic.

        [ ] Add visual feedback (color change/rotation) when the sidebar is pinned.

    [ ] Visual Polish:

        [ ] Add a subtle glow or border-right accent when the timeline is active.

        [ ] Ensure the vertical rail version (60px) displays icon-only indicators for progress.

3. CodingRound Workspace Integration

    [ ] Prop Injection: Update CodingRound signature to accept isSidebarExpanded: boolean.

    [ ] Horizontal Slide: Wrap the renderRound() content in a motion.div to subtly shift the workspace when the sidebar expands.

    [ ] Dynamic Pane Sizing:

        [ ] Set Right Pane (Output) to w-[60%] when the sidebar is expanded.

        [ ] Set Right Pane (Output) to w-[50%] when the sidebar is a rail.

        [ ] Ensure the Left Pane (Editor) occupies the remaining space.

4. Performance & UX Optimization

    [ ] Monaco Editor Resize:

        [ ] Implement a useResizeObserver or trigger editor.layout() to prevent the code editor from lagging behind the container transition.

    [ ] Scroll Management: Force overflow-hidden on the parent container during transitions to prevent temporary scrollbars.

    [ ] Animation Curves: Verify that all transitions use consistent ease-out timing (300ms–500ms).

✅ Success Criteria

    Seamless Entry: Transitioning into the coding round triggers the sidebar to snap to a 60px rail immediately.

    Interactive Expansion: Hovering the rail expands the timeline without breaking the layout.

    Persistence: Clicking the Pin icon locks the sidebar, and the CodingRound layout adjusts its pane ratios permanently.

    Zero Jitter: The Monaco editor and terminal output resize smoothly without flashing or shifting content abruptly.
<script>
    import GridItem from '$lib/components/GridItem.svelte';

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white'];

    let selectedColor = $state(colors[0]);
    let showSettings = $state(false);
</script>

<h1>Tan<br />Nguyen</h1>
<GridItem {content}></GridItem>

{#snippet content()}
<div style="background: red; width: 50px; height: 50px;"></div>
{/snippet}

<style>
</style>
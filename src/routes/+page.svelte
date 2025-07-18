<script>
    import Test from '$lib/components/Test.svelte';

    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white'];

    let selectedColor = $state(colors[0]);
    let showSettings = $state(false);
</script>

<div class="container" style="--color: {selectedColor};">

<h1>Welcome to SvelteKit</h1>
    <Test name="Svelte User" />

    <div class="settings">
        <div class="colors">
            {#each colors as color}
                <button
                    class="color"
                    aria-label={color}
                    aria-current={selectedColor === color}
                    style="--color: {color};"
                    onclick={() => (selectedColor = color)}
                    >
                </button>
            {/each}
        </div>
    </div><!-- .settings -->
</div><!-- .container -->

<style>
    .container {
        background: var(--color, #fff);
        height: 100vh;
        width: 100vw;
    }
    .colors {
        align-items: center;
        display: grid;
        grid-gap: .5em;
		grid-template-columns: repeat(9, 1fr);
    }

    .color {
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--color, #fff);
        filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.2));
		transform: none;
        transition:L all 0.1s;
    }

	.color[aria-current="true"] {
		transform: translate(1px, 1px);
		filter: none;
		box-shadow: inset 3px 3px 4px rgba(0,0,0,0.2);
	}
</style>
### SETUP
import matplotlib.pyplot as plt
from sklearn.metrics import PrecisionRecallDisplay
import numpy as np
import json
import requests
import pandas as pd

# Need to change for every request
BOOSTED = True
QUERY_ID = "Milestone_2/queries/q5/q5"
QUERY_URL = "http://localhost:8983/solr/recipes/select?debugQuery=false&defType=edismax&fq=Date%3A%5B2008-01-01T00%3A00%3A00Z%20TO%202012-01-01T00%3A00%3A00Z%5D&indent=true&pf=AuthorName%5E20&ps=1&q.op=OR&q=peter%20j&qf=AuthorName&rows=100"


QRELS_FILE = QUERY_ID + "-relevant.txt"

if BOOSTED: QUERY_ID = QUERY_ID + "-boosted"
REQUEST_FILE = QUERY_ID + ".txt"
RESULTS_FILE = QUERY_ID + ".tex"
GRAPH_FILE = QUERY_ID + ".pdf"

# Read qrels to extract relevant documents
relevant = list(map(lambda el: int(el.strip()), open(QRELS_FILE).readlines()))

# Get query results from Solr instance
results = requests.get(QUERY_URL).json()['response']['docs']

# Write json
# with open("Milestone_2/berry.json", "w+") as f:
#     f.write(json.dumps(results))
# quit()

# Write IDs
with open(REQUEST_FILE, "w+") as f:
    for doc in results:
        f.write(str(doc["RecipeId"]) + " -> " + doc["Name"] + "\n")

### METRICS TABLE

# Define custom decorator to automatically calculate metric based on key
metrics = {}
metric = lambda f: metrics.setdefault(f.__name__, f)

@metric
def ap(results, relevant):
    """Average Precision"""

    relevant_index = []
    index = 0
    for res in results:
        if res['RecipeId'] in relevant:
            relevant_index.append(index)
        index = index + 1

    if len(relevant_index) == 0:
        return 0

    precision_values = [
        len([
            doc
            for doc in results[:idx]
            if doc['RecipeId'] in relevant
        ]) / idx
        for idx in range(1, len(results) + 1)
    ]
    
    precision_sum = 0
    for ind in relevant_index:
        precision_sum = precision_sum + precision_values[ind]

    return precision_sum/len(relevant_index)

@metric
def p10(results, relevant, n=10):
    """Precision at N"""
    return len([doc for doc in results[:n] if doc['RecipeId'] in relevant])/n

@metric
def r(results, relevant):
    return len([doc for doc in results if doc['RecipeId'] in relevant])/len(relevant)

def calculate_metric(key, results, relevant):
    return metrics[key](results, relevant)

# Define metrics to be calculated
evaluation_metrics = {
    'ap': 'Average Precision',
    'p10': 'Precision at 10 (P@10)',
    'r': 'Recall'
}

# Calculate all metrics and export results as LaTeX table
df = pd.DataFrame([['Metric','Value']] +
    [
        [evaluation_metrics[m], calculate_metric(m, results, relevant)]
        for m in evaluation_metrics
    ]
)

with open(RESULTS_FILE,'w') as tf:
    tf.write(df.to_latex())



### PRECISION-RECALL CURVE

# Calculate precision and recall values as we move down the ranked list
precision_values = [
    len([
        doc 
        for doc in results[:idx]
        if doc['RecipeId'] in relevant
    ]) / idx 
    for idx, _ in enumerate(results, start=1)
]

recall_values = [
    len([
        doc for doc in results[:idx]
        if doc['RecipeId'] in relevant
    ]) / len(relevant)
    for idx, _ in enumerate(results, start=1)
]

precision_recall_match = {k: v for k,v in zip(recall_values, precision_values)}

# Extend recall_values to include traditional steps for a better curve (0.1, 0.2 ...)
recall_values.extend([step for step in np.arange(0.1, 1.1, 0.1) if step not in recall_values])
recall_values = sorted(set(recall_values))

# Extend matching dict to include these new intermediate steps
for idx, step in enumerate(recall_values):
    if step not in precision_recall_match:
        if recall_values[idx-1] in precision_recall_match:
            precision_recall_match[step] = precision_recall_match[recall_values[idx-1]]
        else:
            precision_recall_match[step] = precision_recall_match[recall_values[idx+1]]

disp = PrecisionRecallDisplay([precision_recall_match.get(r) for r in recall_values], recall_values)
disp.plot()

plt.ylim((0, 1.1))
plt.savefig(GRAPH_FILE)
